/** v2書き込み3操作の、インスタンスをまたぐ厳密なスライディング窓を提供する。 */
const limit = 10;
const windowMs = 300_000;

/**
 * 試行を原子的に記録し、拒否時だけ再試行までの秒数を返す。
 * IPそのものは保存せず、期限切れ履歴は次のリクエストで削除する。
 * @param db 全Workerが共有するD1データベース。
 * @param ip Cloudflareが設定した送信元IP。
 * @param now 境界テスト用の時刻。通常は省略し、D1の現在時刻を使う。
 */
export const consumeV2WriteAttempt = async (db: D1Database, ip: string, now?: number): Promise<number | null> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const key = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  // batchはD1の単一トランザクション。判定とINSERTを分離して並列実行しない。
  // 本番ではD1の時計を使い、Worker間の時計のずれで窓が早く切れることを防ぐ。
  const clock = "COALESCE(?, CAST(unixepoch('subsec') * 1000 AS INTEGER))";
  const [, inserted, oldest] = await db.batch<Record<string, unknown>>([
    db.prepare(`DELETE FROM v2_write_attempts WHERE attempted_at <= ${clock} - ?`).bind(now ?? null, windowMs),
    db
      .prepare(`INSERT INTO v2_write_attempts (ip_hash, attempted_at)
      SELECT ?, ${clock} WHERE (SELECT COUNT(*) FROM v2_write_attempts WHERE ip_hash = ? AND attempted_at > ${clock} - ?) < ?
      RETURNING attempted_at`)
      .bind(key, now ?? null, key, now ?? null, windowMs, limit),
    db
      .prepare(`SELECT COALESCE(MIN(attempted_at) + ? - ${clock}, 0) AS wait_ms FROM v2_write_attempts
        WHERE ip_hash = ? AND attempted_at > ${clock} - ?`)
      .bind(windowMs, now ?? null, key, now ?? null, windowMs),
  ]);
  if (!inserted || !oldest) throw new Error('Incomplete D1 rate limit result');
  if (inserted.results.length > 0) return null;
  const waitMs = oldest.results[0]?.wait_ms;
  if (typeof waitMs !== 'number') throw new Error('Invalid D1 rate limit timestamp');
  return Math.max(1, Math.min(300, Math.ceil(waitMs / 1000)));
};
