/**
 * 一覧の取得条件とkeyset境界を、24時間有効な署名付きcursorとして扱う。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import { ProblemException } from './app';
import { dateTimeSchema, numberSchema } from './routes/common';

/** 署名対象の条件・境界・発行時刻。未知のフィールドは拒否する。 */
const cursorSchema = z.strictObject({
  resource: z.enum(['issues', 'prs']),
  state: z.enum(['open', 'closed', 'all']),
  limit: z.number().int().min(1).max(100),
  createdAt: dateTimeSchema,
  number: numberSchema,
  issuedAt: z.number().int().nonnegative(),
});
/** 検証済みcursorのペイロード。 */
type Cursor = z.infer<typeof cursorSchema>;
/** cursorの再利用時にも一致が必要な一覧取得条件。 */
export type PageConditions = Pick<Cursor, 'resource' | 'state' | 'limit'>;
/** 次ページから除外する最後の項目の作成日時と番号。 */
export type Boundary = Pick<Cursor, 'createdAt' | 'number'>;
const encoder = new TextEncoder();
/** バイト列をパディングなしのbase64urlへ変換する。 */
const encode = (value: Uint8Array): string =>
  btoa(String.fromCharCode(...value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
/**
 * 正規表現と再エンコードでbase64urlの正規形を確認して復号する。
 * @throws {Error} 使用できない文字や非正規の表現が含まれる場合。
 */
const decode = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[\w-]+$/.test(value)) throw new Error('Invalid base64url');
  const bytes = Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
  if (encode(bytes) !== value) throw new Error('Noncanonical base64url');
  return bytes;
};
/** cursor専用の用途識別子を付けて、HMAC-SHA-256の署名・検証鍵を作る。 */
const signingKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', encoder.encode(`v2-pagination\n${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);

/**
 * 既存のGitHub App秘密鍵を使い、追加の秘密設定なしでcursorの改ざんを検出する。
 * @param conditions 次ページでも維持するリソース種別・state・limit。
 * @param boundary 現在のページで最後に返した項目の作成日時と番号。
 * @param secret リポジトリ識別子とGitHub App秘密鍵を組み合わせた署名用秘密値。
 * @returns 発行時刻を含む、署名付きbase64url形式のcursor。
 */
export const issueCursor = async (conditions: PageConditions, boundary: Boundary, secret: string): Promise<string> => {
  const payload = encode(
    encoder.encode(
      JSON.stringify({ ...conditions, createdAt: boundary.createdAt, number: boundary.number, issuedAt: Date.now() }),
    ),
  );
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
};

/**
 * cursorの署名・取得条件・24時間の有効期限を検証し、次ページの境界を返す。
 * @param value クエリで受け取ったcursor。
 * @param conditions 今回の一覧取得条件。
 * @param secret 発行時と同じ署名用秘密値。
 * @returns 検証済みの作成日時と番号。
 * @throws {ProblemException} 不正・条件不一致・期限切れ・改ざん時は400 INVALID_CURSOR。
 */
export const readCursor = async (value: string, conditions: PageConditions, secret: string): Promise<Boundary> => {
  try {
    const parts = value.split('.');
    if (parts.length !== 2) throw new Error('Invalid cursor');
    const [payload = '', signature = ''] = parts;
    if (!(await crypto.subtle.verify('HMAC', await signingKey(secret), decode(signature), encoder.encode(payload)))) {
      throw new Error('Invalid signature');
    }
    const cursor = cursorSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decode(payload))));
    if (
      cursor.resource !== conditions.resource ||
      cursor.state !== conditions.state ||
      cursor.limit !== conditions.limit ||
      cursor.issuedAt > Date.now() ||
      Date.now() - cursor.issuedAt >= 86400000
    )
      throw new Error('Invalid cursor conditions');
    return { createdAt: cursor.createdAt, number: cursor.number };
  } catch {
    throw new ProblemException(400, 'INVALID_CURSOR');
  }
};
