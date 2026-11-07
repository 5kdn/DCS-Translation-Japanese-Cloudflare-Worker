/**
 * treeの契約・全件スナップショット取得と、filesでも使うコミット固定の取得処理。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { isFilePathAllowed } from '@/config/filePermissionFilters';
import type { GitHubContext } from '@/services/githubService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv, Bindings } from '@/types/env';
import { ProblemException } from '../../app';
import { dependencyUnavailable, getGitHubContext, githubRequest } from '../../github';
import { dateTimeSchema, emptyRequest, failure, jsonMiddleware, readFailures, shaSchema } from '../common';
import type { filesSchema } from '../files/get';
import { fileSchema } from '../files/schemas';

/** ファイル情報にblobのmodeとtypeを加えた、ツリーの公開項目。 */
const treeItemSchema = z
  .strictObject({
    ...fileSchema.shape,
    mode: z.enum(['100644', '100755', '120000']),
    type: z.literal('blob'),
  })
  .openapi('TreeItem');

/** コミット・生成日時と最大100,000件のツリー項目を持つ公開応答。 */
export const treeSnapshotSchema = z
  .strictObject({
    commitSha: shaSchema,
    generatedAt: dateTimeSchema,
    items: z.array(treeItemSchema).max(100000),
  })
  .openapi('TreeSnapshot');

/** 認証不要の全件ツリー取得操作のOpenAPI定義。 */
export const getTree = createRoute({
  operationId: 'getTree',
  method: 'get',
  path: '/tree',
  security: [],
  middleware: jsonMiddleware,
  request: emptyRequest,
  responses: {
    200: { description: 'ツリーの全件スナップショット。', content: { 'application/json': { schema: treeSnapshotSchema } } },
    ...readFailures,
    422: failure,
  },
});

/**
 * デフォルトブランチの取得開始時点のコミットに固定した全件ツリーを返す。
 * @param c GitHubとメタデータDBのバインディングを持つリクエストコンテキスト。
 * @returns 件数・バイト数の上限を検証した全件スナップショットのJSON応答。
 */
export const getTreeHandler: RouteHandler<typeof getTree, AppEnv> = async (c) => c.json(await getSnapshot(c.env), 200);

const encoder = new TextEncoder();
/**
 * 取得データを応答スキーマで検証し、不正な依存先データを502に変換する。
 * @param schema 期待する応答スキーマ。
 * @param value 検証前のデータ。
 * @returns スキーマに適合したデータ。
 * @throws {HTTPException} スキーマに適合しない場合は502。
 */
const parseUpstream = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(502);
  return result.data;
};

/** 完全性の判定に必要なtruncatedフラグを含むGitHubのツリー応答。 */
const treeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(
    z.object({
      path: z.string(),
      type: z.enum(['blob', 'tree', 'commit']),
      mode: z.string(),
      sha: shaSchema,
      size: z.number().int().nonnegative().optional(),
    }),
  ),
});

/** UTF-8バイト数・許可ディレクトリ・危険な文字やセグメントを補正せず検証する。 */
const validPath = (path: string): boolean =>
  encoder.encode(path).length <= 4096 &&
  isFilePathAllowed(path) &&
  !/[\\\p{Cc}]/u.test(path) &&
  path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..' && !segment.startsWith('.git'));
/** パスの各セグメントをエンコードし、取得時のコミットに固定したraw URLを作る。 */
const rawUrl = (ctx: GitHubContext, commit: string, path: string): string =>
  `https://raw.githubusercontent.com/${encodeURIComponent(ctx.owner)}/${encodeURIComponent(ctx.repo)}/${commit}/${path.split('/').map(encodeURIComponent).join('/')}`;

/**
 * 指定ファイルの情報と登録済み更新日時を、同じコミットに固定して取得する。
 * @param env GitHubとメタデータDBの設定を含むWorkerのバインディング。
 * @param paths 検証済みの件数・重複条件を満たす、要求順のファイルパス。
 * @returns 要求順のファイル情報・raw URLとスナップショットのメタデータ。
 * @throws {HTTPException} パス不正は400、対象不存在は404、依存先の障害は502または503。
 */
export function getSnapshot(env: Bindings, paths: string[]): Promise<z.infer<typeof filesSchema>>;
/**
 * 許可されたblob全件をUTF-8バイト順で返す、メタデータ付きスナップショットを取得する。
 * @param env GitHubとメタデータDBの設定を含むWorkerのバインディング。
 * @returns コミット固定の全件ツリーとスナップショットのメタデータ。
 * @throws {ProblemException} 100,000件またはUTF-8 JSON全体20 MiB超過時は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} GitHubの切り詰め・不正応答は502、依存先の利用不可は503。
 */
export function getSnapshot(env: Bindings): Promise<z.infer<typeof treeSnapshotSchema>>;
/** コミットを一度だけ解決し、完全なツリーと登録済み更新日時を結合する共通実装。 */
export async function getSnapshot(
  env: Bindings,
  paths?: string[],
): Promise<z.infer<typeof treeSnapshotSchema> | z.infer<typeof filesSchema>> {
  if (paths && !paths.every(validPath)) throw new HTTPException(400);
  const ctx = await getGitHubContext(env);
  const { octokit, owner, repo, defaultBranch } = ctx;
  const commitSha = await githubRequest(
    async () =>
      z
        .object({ commit: z.object({ sha: shaSchema }) })
        .parse((await octokit.rest.repos.getBranch({ owner, repo, branch: defaultBranch })).data).commit.sha,
  );
  const tree = await githubRequest(async () =>
    treeSchema.parse((await octokit.rest.git.getTree({ owner, repo, tree_sha: commitSha, recursive: 'true' })).data),
  );
  if (tree.truncated) throw new HTTPException(502);
  const blobs = tree.tree.filter((item) => item.type === 'blob' && validPath(item.path));
  if (!paths && blobs.length > 100000) throw new ProblemException(422, 'SNAPSHOT_LIMIT_EXCEEDED');
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
  /** 選択済みblobにコミット固定URLと登録済み更新日時を付け、公開スキーマで検証する。 */
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
    const value = parseUpstream(treeSnapshotSchema.shape.items.element, { ...file(item), mode: item.mode, type: 'blob' });
    // 全体の巨大なJSONを作る前に、区切り文字を含む正確なUTF-8サイズを確認する。
    bytes += encoder.encode(JSON.stringify(value)).length + (items.length > 0 ? 1 : 0);
    if (bytes > 20971520) throw new ProblemException(422, 'SNAPSHOT_LIMIT_EXCEEDED');
    items.push(value);
  }
  return { ...snapshot, items };
}
