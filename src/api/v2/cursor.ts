/**
 * Issue・PRのkeyset境界とtreeのコミット・継続位置を、24時間有効な署名付きcursorとして扱う。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import { ProblemException } from './app';
import { dateTimeSchema, numberSchema, shaSchema } from './routes/common';

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
/** cursorのJSONと署名対象文字列をUTF-8へ変換する。 */
const encoder = new TextEncoder();
/**
 * バイト列をパディングなしのbase64urlへ変換する。
 * @param value エンコードするペイロードまたは署名のバイト列。
 * @returns URLで扱える、パディングを除いたbase64url文字列。
 */
const encode = (value: Uint8Array): string =>
  btoa(String.fromCharCode(...value))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
/**
 * 正規表現と再エンコードでbase64urlの正規形を確認して復号する。
 * @param value ペイロードまたは署名のbase64url文字列。
 * @returns 正規形であることを検証した復号後のバイト列。
 * @throws {Error} 使用できない文字や非正規の表現が含まれる場合。
 */
const decode = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[\w-]+$/.test(value)) throw new Error('Invalid base64url');
  const bytes = Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
  if (encode(bytes) !== value) throw new Error('Noncanonical base64url');
  return bytes;
};
/**
 * cursor専用の用途識別子を付けて、HMAC-SHA-256の署名・検証鍵を作る。
 * @param secret リポジトリ識別子とGitHub App秘密鍵を組み合わせた秘密値。
 * @returns 署名と検証に使う、エクスポート不可の暗号鍵。
 */
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
export const issueCursor = (conditions: PageConditions, boundary: Boundary, secret: string): Promise<string> =>
  signCursor({ ...conditions, createdAt: boundary.createdAt, number: boundary.number, issuedAt: Date.now() }, secret);

/**
 * 一覧種別ごとのペイロードを同じHMAC方式で署名する。
 * @param value 発行側で組み立てた、JSONに変換可能なペイロード。
 * @param secret リポジトリに結び付けた署名用の秘密値。
 * @returns base64urlのペイロードと署名をドットで連結したcursor。
 */
const signCursor = async (value: unknown, secret: string): Promise<string> => {
  const payload = encode(encoder.encode(JSON.stringify(value)));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
};

/**
 * 署名を確認してからJSONを復号する。スキーマ・条件は呼び出し元で検証する。
 * @param value ペイロードと署名を含む、受信したcursor。
 * @param secret 発行時と同じ署名用の秘密値。
 * @returns 一覧種別ごとのスキーマでは未検証のJSON値。
 * @throws {Error} 構造・base64url・署名・UTF-8・JSONの検証に失敗した場合。
 */
const verifyCursor = async (value: string, secret: string): Promise<unknown> => {
  const parts = value.split('.');
  if (parts.length !== 2) throw new Error('Invalid cursor');
  const [payload = '', signature = ''] = parts;
  if (!(await crypto.subtle.verify('HMAC', await signingKey(secret), decode(signature), encoder.encode(payload)))) {
    throw new Error('Invalid signature');
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decode(payload)));
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
    const cursor = cursorSchema.parse(await verifyCursor(value, secret));
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

/** コミット固定ツリーの継続位置。Issue/PRのcursorとは相互利用できない。 */
const treeCursorSchema = z.strictObject({
  resource: z.literal('tree'),
  commitSha: shaSchema,
  offset: z.number().int().min(1).max(9999),
  limit: z.number().int().min(1).max(10000),
  issuedAt: z.number().int().nonnegative(),
});
/** 検証済みのtree継続情報。issuedAtは最初のページの発行時刻を維持する。 */
type TreeCursor = z.infer<typeof treeCursorSchema>;

/**
 * コミット・取得件数・次の位置を改ざんできない継続情報として発行する。
 * @param cursor 固定コミット・次の位置・limit・取得開始時の発行時刻。発行側で検証済みの値を渡す。
 * @param secret リポジトリ識別子とGitHub App秘密鍵を組み合わせた署名用秘密値。
 * @returns tree専用の用途識別子を含む、署名付きのcursor。
 */
export const issueTreeCursor = (cursor: Omit<TreeCursor, 'resource'>, secret: string): Promise<string> =>
  signCursor({ ...cursor, resource: 'tree' }, secret);

/**
 * 取得開始から24時間有効なtree専用cursorを検証する。
 * @param value クエリで受け取ったcursor。
 * @param limit 今回指定されたページ件数。発行時と一致する必要がある。
 * @param secret 発行時と同じ署名用秘密値。
 * @returns 固定コミット・次の位置・取得開始時刻を含む、検証済みの継続情報。
 * @throws {ProblemException} 不正・改ざん・条件不一致・期限切れ時は400 INVALID_CURSOR。
 */
export const readTreeCursor = async (value: string, limit: number, secret: string): Promise<TreeCursor> => {
  try {
    const cursor = treeCursorSchema.parse(await verifyCursor(value, secret));
    if (cursor.limit !== limit || cursor.issuedAt > Date.now() || Date.now() - cursor.issuedAt >= 86400000) {
      throw new Error('Invalid tree cursor conditions');
    }
    return cursor;
  } catch {
    throw new ProblemException(400, 'INVALID_CURSOR');
  }
};
