/**
 * コミット固定のツリーページ取得と、filesでも使うメタデータ結合処理。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { getRequiredEnvString } from '@/helpers/environmentHelper';
import type { GitHubContext } from '@/services/githubService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv, Bindings } from '@/types/env';
import { dependencyUnavailable, ProblemException } from '../../app';
import { issueTreeCursor, readTreeCursor } from '../../cursor';
import { getGitHubContext } from '../../githubAdapter';
import { validRepositoryPath as validPath } from '../../paths';
import { dateTimeSchema, failure, jsonMiddleware, pageSchema, readFailures, shaSchema } from '../common';
import type { filesSchema } from '../files/get';
import { fileSchema } from '../files/schemas';
import { loadTree } from './cache';

/** 想定最大1万件を、件数による分割なしで取得できる既定値兼全体上限。 */
const MAX_ITEMS = 10000;
/** 全件検証・ソート・JSON生成のメモリ使用量を制限する内部スナップショットの上限。 */
const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
/** 実データからの1万件推計サイズに余裕を持たせた、公開ページ全体のJSONサイズ上限。 */
const MAX_PAGE_BYTES = 8 * 1024 * 1024;
/** JSON応答とパスのUTF-8バイト数を計算する。 */
const encoder = new TextEncoder();
/** 許可されたblobのファイル情報・mode・型を検証する公開スキーマ。 */
const treeItemSchema = z
  .strictObject({
    ...fileSchema.shape,
    mode: z.enum(['100644', '100755', '120000']),
    type: z.literal('blob'),
  })
  .openapi('TreeItem');

/** 全件の検証用スキーマ。全体を検証してから最初のページを返す。 */
export const treeSnapshotSchema = z.strictObject({
  commitSha: shaSchema,
  generatedAt: dateTimeSchema,
  items: z.array(treeItemSchema).max(MAX_ITEMS),
});
/** 固定コミットのファイル一覧に、全件取得の完了判定に使う継続情報を付ける。 */
const treePageSchema = treeSnapshotSchema.extend({ page: pageSchema }).openapi('TreeSnapshot');
/** tree専用のlimitとcursorだけを許可し、未定義のクエリを拒否する。 */
const treeQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(MAX_ITEMS).openapi({ default: MAX_ITEMS }).optional(),
  cursor: z.string().min(1).max(2048).optional(),
});

/** 認証不要の、同一コミットに固定したツリーページ。 */
export const getTree = createRoute({
  operationId: 'getTree',
  method: 'get',
  path: '/tree',
  description:
    '毎回全件取得する用途向け。limitは既定・最大10,000件、各ページのUTF-8 JSON応答は最大8 MiB。' +
    'サイズ上限によりlimit未満でも続きがあるため、page.nextCursorがnullになるまで同じlimitで取得し、完了後にのみ削除判定する。' +
    'cursorは取得開始から24時間有効で、全ページを同一コミットに固定する。' +
    '最新コミットは60秒、SHA固定のGitHubツリーは1年間キャッシュする（保持は保証しない）。' +
    '全スナップショットは最大10,000件・UTF-8 JSON 20 MiB。上限超過は422 SNAPSHOT_LIMIT_EXCEEDED、' +
    'GitHubのツリー切り詰めは502とし、不完全な一覧は返さない。',
  security: [],
  middleware: jsonMiddleware,
  request: { query: treeQuerySchema },
  responses: {
    200: {
      description: 'コミット固定のツリーページ。nextCursorがnullなら取得完了。',
      content: { 'application/json': { schema: treePageSchema } },
    },
    ...readFailures,
    422: failure,
  },
});

/**
 * 件数・バイト数の両方で分割し、キャッシュが消えてもcursorのコミットから再構築する。
 * 最初の応答前に全体を検証し、最終ページではnextCursorをnullにする。
 * @param c 検証済みのクエリ・Workerバインディング・リクエストURLを持つコンテキスト。
 * @returns 固定コミットのツリーページを含む200のJSON応答。公開ページ自体はキャッシュしない。
 * @throws {ProblemException} cursor不正は400 INVALID_CURSOR、全体上限超過は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} GitHubの切り詰め・不正応答は502、依存先の利用不可・回数制限は503。
 */
export const getTreeHandler: RouteHandler<typeof getTree, AppEnv> = async (c) => {
  const query = c.req.valid('query');
  const limit = query.limit ?? MAX_ITEMS;
  const secret = `${c.env.TARGET_GH_OWNER}/${c.env.TARGET_GH_REPO}\n${getRequiredEnvString('TARGET_GH_APP_PRIVATE_KEY', c.env.TARGET_GH_APP_PRIVATE_KEY)}`;
  const cursor = query.cursor ? await readTreeCursor(query.cursor, limit, secret) : undefined;
  const snapshot = await getSnapshot(c.env, undefined, {
    origin: new URL(c.req.url).origin,
    commitSha: cursor?.commitSha,
  });
  const start = cursor?.offset ?? 0;
  if (cursor && start >= snapshot.items.length) throw new ProblemException(400, 'INVALID_CURSOR');
  const { items: all, ...header } = snapshot;
  const items: typeof all = [];
  // 最大長のcursorを予約し、署名の生成をページ当たり1回に抑える。
  let bytes = encoder.encode(JSON.stringify({ ...header, items: [], page: { nextCursor: null } })).length + 2048;
  for (const item of all.slice(start, start + limit)) {
    const size = encoder.encode(JSON.stringify(item)).length + (items.length ? 1 : 0);
    if (bytes + size > MAX_PAGE_BYTES) break;
    bytes += size;
    items.push(item);
  }
  if (!items.length && all.length) throw new ProblemException(422, 'SNAPSHOT_LIMIT_EXCEEDED');
  const offset = start + items.length;
  const nextCursor =
    offset < all.length
      ? await issueTreeCursor(
          { commitSha: snapshot.commitSha, offset, limit, issuedAt: cursor?.issuedAt ?? Date.now() },
          secret,
        )
      : null;
  // updatedAtはコミットとは独立して更新されるため、公開ページ自体は長期キャッシュしない。
  c.header('Cache-Control', 'no-store');
  return c.json({ ...header, items, page: { nextCursor } }, 200);
};

/**
 * 不正な依存先データを公開応答へ流さない。
 * @typeParam T スキーマ検証後の値の型。
 * @param schema 公開応答として許可する形式のスキーマ。
 * @param value GitHubとメタデータから組み立てた、検証前の値。
 * @returns スキーマに適合した値。
 * @throws {HTTPException} 値がスキーマに適合しない場合は502。
 */
const parseUpstream = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(502);
  return result.data;
};

/**
 * パスの各セグメントをエンコードした、コミット固定のraw URLを作る。
 * @param ctx 対象リポジトリのownerとrepoを含むGitHubコンテキスト。
 * @param commit 取得先を固定するコミットSHA。
 * @param path 検証済みのリポジトリ相対ファイルパス。
 * @returns owner・repo・パスの各セグメントをURLエンコードしたraw URL。
 */
const rawUrl = (ctx: GitHubContext, commit: string, path: string): string =>
  `https://raw.githubusercontent.com/${encodeURIComponent(ctx.owner)}/${encodeURIComponent(ctx.repo)}/${commit}/${path.split('/').map(encodeURIComponent).join('/')}`;

/**
 * filesは従来どおり最新コミットを解決し、指定順で返す。
 * @param env GitHub接続設定とTREE_METADATA_DBを含むWorkerのバインディング。
 * @param paths 件数と重複条件を呼び出し元で検証済みのファイルパス。
 * @returns 同じコミットのファイル情報を要求順に並べたスナップショット。
 * @throws {HTTPException} パス不正は400、対象不存在は404、依存先の障害は502または503。
 */
export function getSnapshot(env: Bindings, paths: string[]): Promise<z.infer<typeof filesSchema>>;
/**
 * 全ツリーをUTF-8パス順で返し、options指定時はコミット固定と共有キャッシュを利用する。
 * @param env GitHub接続設定とTREE_METADATA_DBを含むWorkerのバインディング。
 * @param paths 全件取得では省略する。
 * @param options キャッシュキー用originと、継続取得で固定する任意のコミットSHA。
 * @returns 件数・バイト数を検証済みの全件スナップショット。未登録の更新日時はnull。
 * @throws {ProblemException} 10,000件または内部JSON全体20 MiBの超過時は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} GitHubの切り詰め・不正応答は502、依存先の利用不可は503。
 */
export function getSnapshot(
  env: Bindings,
  paths?: undefined,
  options?: { origin: string; commitSha?: string },
): Promise<z.infer<typeof treeSnapshotSchema>>;
/**
 * 同一コミットのGitHubツリーと、各リクエスト時点の登録済み更新日時を結合する共通実装。
 * @param env GitHub接続設定・対象リポジトリ・メタデータDBのバインディング。
 * @param paths 指定時は要求順のファイル情報、省略時は許可されたblob全件を取得する。
 * @param options tree用の共有キャッシュとコミット固定の条件。
 * @returns コミットSHA・生成日時と、全件ツリーまたは指定ファイル情報。
 * @throws {ProblemException} 全件取得の件数・JSONサイズ上限を超える場合は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} パス不正は400、指定ファイルの不存在は404、依存先の障害は502または503。
 */
export async function getSnapshot(
  env: Bindings,
  paths?: string[],
  options?: { origin: string; commitSha?: string },
): Promise<z.infer<typeof treeSnapshotSchema> | z.infer<typeof filesSchema>> {
  if (paths && !paths.every(validPath)) throw new HTTPException(400);
  const ctx = await getGitHubContext(env);
  const { commitSha, tree } = await loadTree(ctx, options);
  const blobs = tree.tree.filter((item) => item.type === 'blob' && validPath(item.path));
  if (!paths && blobs.length > MAX_ITEMS) throw new ProblemException(422, 'SNAPSHOT_LIMIT_EXCEEDED');
  const byPath = paths ? new Map(blobs.map((item) => [item.path, item])) : undefined;
  const selected = paths
    ? paths.map((path) => {
        const item = byPath?.get(path);
        if (!item) throw new HTTPException(404);
        return item;
      })
    : blobs
        .map((item) => ({ item, bytes: encoder.encode(item.path) }))
        .sort((a, b) => {
          for (let i = 0; i < Math.min(a.bytes.length, b.bytes.length); i++) {
            const difference = (a.bytes[i] ?? 0) - (b.bytes[i] ?? 0);
            if (difference) return difference;
          }
          return a.bytes.length - b.bytes.length;
        })
        .map(({ item }) => item);
  if (!env.TREE_METADATA_DB) throw dependencyUnavailable();
  let updates: Record<string, Date | null>;
  try {
    updates = await new TreePathUpdatedAtService(env.TREE_METADATA_DB).read();
  } catch {
    throw dependencyUnavailable();
  }
  const snapshot = { commitSha, generatedAt: new Date().toISOString() };
  /**
   * 選択したblobにコミット固定URLと最新の登録済み更新日時を付ける。
   * @param item パスで選択・検証したGitHubのblob項目。
   * @returns 公開スキーマで検証済みのファイル情報。未登録の更新日時はnull。
   * @throws {HTTPException} ファイル情報が公開スキーマに適合しない場合は502。
   */
  const file = (item: (typeof selected)[number]): z.infer<typeof fileSchema> =>
    parseUpstream(fileSchema, {
      path: item.path,
      sha: item.sha,
      size: item.size,
      url: rawUrl(ctx, commitSha, item.path),
      updatedAt: updates[item.path]?.toISOString() ?? null,
    });
  if (paths) return { ...snapshot, files: selected.map(file) };
  const items: z.infer<typeof treeSnapshotSchema>['items'] = [];
  let bytes = encoder.encode(JSON.stringify({ ...snapshot, items: [] })).length;
  for (const item of selected) {
    const value = parseUpstream(treeItemSchema, { ...file(item), mode: item.mode, type: 'blob' });
    bytes += encoder.encode(JSON.stringify(value)).length + (items.length > 0 ? 1 : 0);
    if (bytes > MAX_SNAPSHOT_BYTES) throw new ProblemException(422, 'SNAPSHOT_LIMIT_EXCEEDED');
    items.push(value);
  }
  return { ...snapshot, items };
}
