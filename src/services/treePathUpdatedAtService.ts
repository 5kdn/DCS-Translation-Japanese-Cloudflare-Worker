export type TreePathUpdatedAtItem = {
  path: string;
  updatedAt: number;
};

/**
 * @summary tree_path_updated_atテーブルの更新時刻を管理するサービスである。
 * @class
 */
export class TreePathUpdatedAtService {
  /**
   * @summary D1Databaseを受け取り、サービスの依存関係として保持する。
   * @param db D1Databaseを渡す。
   */
  public constructor(private readonly db: D1Database) {}

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_BASE_DELAY_MS = 50;
  private static readonly UPSERT_CHUNK_SIZE = 50;

  /**
   * @summary パスごとの更新時刻をまとめてUPSERTする。
   * @param files 更新対象のパスと更新時刻を渡す。
   */
  public async upsert(files: TreePathUpdatedAtItem[]): Promise<void> {
    if (files.length === 0) return;
    for (let start = 0; start < files.length; start += TreePathUpdatedAtService.UPSERT_CHUNK_SIZE) {
      const chunk = files.slice(start, start + TreePathUpdatedAtService.UPSERT_CHUNK_SIZE);
      await this.runWithRetry(() => this.upsertTransaction(chunk), 'tree_path_updated_at.upsert');
    }
  }

  /**
   * @summary tree_path_updated_atの全件を読み取る。
   * @returns パスをキー、更新時刻を値とするRecordを返す。
   */
  public async read(): Promise<Record<string, Date | null>> {
    const result = await this.runWithRetry(
      () =>
        this.db.prepare('SELECT path, updated_at FROM tree_path_updated_at').all<{
          path: string;
          updated_at: number | null;
        }>(),
      'tree_path_updated_at.read',
    );
    return (result.results ?? []).reduce<Record<string, Date | null>>((acc, row) => {
      acc[row.path] = row.updated_at == null ? null : new Date(row.updated_at);
      return acc;
    }, {});
  }

  /**
   * @summary トランザクション内で複数件のUPSERTを行う。
   * @param files 更新対象のパスと更新時刻を渡す。
   */
  private async upsertTransaction(files: TreePathUpdatedAtItem[]): Promise<void> {
    const sql =
      'INSERT INTO tree_path_updated_at (path, updated_at) VALUES (?1, ?2) ON CONFLICT(path) DO UPDATE SET updated_at = excluded.updated_at';
    const batchStatements = files.map((file) => this.db.prepare(sql).bind(file.path, file.updatedAt));
    await this.db.batch(batchStatements);
  }

  /**
   * @summary 失敗時にリトライしながら処理を実行する。
   * @template T 実行結果の型を指定する。
   * @param action 実行する処理を渡す。
   * @param label ログ用ラベルを渡す。
   * @returns 実行結果を返す。
   */
  private async runWithRetry<T>(action: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < TreePathUpdatedAtService.MAX_RETRIES; attempt += 1) {
      try {
        return await action();
      } catch (err) {
        lastError = err;
        if (attempt + 1 >= TreePathUpdatedAtService.MAX_RETRIES) break;
        const baseDelayMs = TreePathUpdatedAtService.RETRY_BASE_DELAY_MS * 2 ** attempt;
        const jitterMs = Math.floor(baseDelayMs * (0.5 + Math.random()));
        await this.sleep(jitterMs);
      }
    }
    console.error(`[d1] ${label} failed after retries`, lastError);
    throw lastError;
  }

  /**
   * @summary 指定ミリ秒だけ待機する。
   * @param ms 待機するミリ秒を渡す。
   * @returns 完了したら解決する。
   */
  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
