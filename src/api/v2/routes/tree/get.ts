/**
 * treeの契約・全件スナップショット取得と、filesでも使うコミット固定の取得処理。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import type { GitHubContext } from '@/services/githubService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv, Bindings } from '@/types/env';
import { dependencyUnavailable, ProblemException } from '../../app';
import { getGitHubContext, githubRequest } from '../../githubAdapter';
import { validRepositoryPath as validPath } from '../../paths';
import { dateTimeSchema, emptyRequest, failure, jsonMiddleware, readFailures, shaSchema } from '../common';
import type { filesSchema } from '../files/get';
import { fileSchema } from '../files/schemas';

/**
 * ツリーの公開項目を検証するZodスキーマ。
 *
 * ファイルのパス・raw URL・SHA・サイズ・更新日時に加え、modeとblob型を必須とする。
 * modeは通常ファイル・実行可能ファイル・シンボリックリンクの値を受け付ける。
 * 未定義の項目は拒否し、OpenAPIではTreeItemとして公開する。
 */
const treeItemSchema = z
  .strictObject({
    ...fileSchema.shape,
    mode: z.enum(['100644', '100755', '120000']),
    type: z.literal('blob'),
  })
  .openapi('TreeItem');

/**
 * 全件ツリー取得の成功応答を検証するZodスキーマ。
 *
 * コミットSHA・生成日時・最大100,000件のツリー項目を必須とする。
 * 未定義の項目は拒否し、OpenAPIではTreeSnapshotとして公開する。
 * UTF-8 JSON全体の20 MiB上限はgetSnapshotで検証する。
 */
export const treeSnapshotSchema = z
  .strictObject({
    commitSha: shaSchema,
    generatedAt: dateTimeSchema,
    items: z.array(treeItemSchema).max(100000),
  })
  .openapi('TreeSnapshot');

/**
 * 認証不要の全件ツリー取得操作（GET /v2/tree）のOpenAPIルート定義。
 *
 * 成功時はコミットに固定した全件スナップショットを200で返す。
 * 件数・応答サイズの上限超過による422と、読み取り操作の失敗応答を定義する。
 *
 * @remarks
 * パスパラメーター・リクエスト本文は使用せず、クエリパラメーターは受け付けない。
 * 対象リポジトリと既定ブランチはWorkerのバインディングで指定する。
 */
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
 *
 * @param c Honoのリクエストコンテキスト。c.envからGitHub接続設定・対象リポジトリ・
 * 既定ブランチ・TREE_METADATA_DBを取得する。リクエスト固有の入力は使用しない。
 * @returns 件数・バイト数の上限を検証した、ステータス200の全件スナップショットのJSON応答。
 * @throws {ProblemException} 100,000件またはUTF-8 JSON全体20 MiBの上限超過時は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} GitHubの切り詰め・通信・応答検証の失敗は502、依存先の利用不可・回数制限は503。
 */
export const getTreeHandler: RouteHandler<typeof getTree, AppEnv> = async (c) => c.json(await getSnapshot(c.env), 200);

const encoder = new TextEncoder();
/**
 * 取得データを応答スキーマで検証し、不正な依存先データを502に変換する。
 *
 * @typeParam T 検証後のデータ型。
 * @param schema 期待する応答形式と検証後の型を定義したZodスキーマ。
 * @param value GitHubの応答やメタデータから組み立てた、検証前のデータ。
 * @returns スキーマに適合したデータ。
 * @throws {HTTPException} スキーマに適合しない場合は502。
 */
const parseUpstream = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(502);
  return result.data;
};

/**
 * GitHubのツリー取得応答を検証するZodスキーマ。
 *
 * 切り詰めの有無を表すtruncatedと、各項目のパス・型・mode・SHAを必須とし、サイズは任意とする。
 * truncatedがtrueの場合の502応答はgetSnapshotで処理する。
 */
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

/**
 * パスの各セグメントをエンコードし、取得時のコミットに固定したraw URLを作る。
 *
 * @param ctx 対象リポジトリのownerとrepoを取得するGitHubコンテキスト。
 * @param commit ファイルの取得先を固定するコミットSHA。
 * @param path 検証済みのリポジトリ相対ファイルパス。
 * @returns owner・repo・パスの各セグメントをURLエンコードしたraw.githubusercontent.comのURL。
 */
const rawUrl = (ctx: GitHubContext, commit: string, path: string): string =>
  `https://raw.githubusercontent.com/${encodeURIComponent(ctx.owner)}/${encodeURIComponent(ctx.repo)}/${commit}/${path.split('/').map(encodeURIComponent).join('/')}`;

/**
 * 指定ファイルの情報と登録済み更新日時を、同じコミットに固定して取得する。
 *
 * @param env GitHub接続設定・対象リポジトリ・既定ブランチ・TREE_METADATA_DBを含むWorkerのバインディング。
 * @param paths 件数・重複条件を呼び出し元で検証済みの、リポジトリ相対ファイルパスの配列。
 * パスの安全性はこの関数で検証し、応答では指定順を維持する。
 * @returns コミットSHA・生成日時と、要求順のファイル情報・raw URL・更新日時を持つスナップショット。
 * 未登録の更新日時はnullとする。
 * @throws {HTTPException} パス不正は400、対象不存在は404、依存先の障害は502または503。
 */
export function getSnapshot(env: Bindings, paths: string[]): Promise<z.infer<typeof filesSchema>>;
/**
 * 許可されたblob全件をUTF-8バイト順で返す、メタデータ付きスナップショットを取得する。
 *
 * @param env GitHub接続設定・対象リポジトリ・既定ブランチ・TREE_METADATA_DBを含むWorkerのバインディング。
 * @returns コミットSHA・生成日時と、パスのUTF-8バイト順に並べた全件ツリーを持つスナップショット。
 * 未登録の更新日時はnullとする。
 * @throws {ProblemException} 100,000件またはUTF-8 JSON全体20 MiB超過時は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} GitHubの切り詰め・不正応答は502、依存先の利用不可は503。
 */
export function getSnapshot(env: Bindings): Promise<z.infer<typeof treeSnapshotSchema>>;
/**
 * コミットを一度だけ解決し、完全なツリーと登録済み更新日時を結合する共通実装。
 *
 * @param env GitHub接続設定・対象リポジトリ・既定ブランチ・TREE_METADATA_DBを含むWorkerのバインディング。
 * @param paths 取得するファイルのリポジトリ相対パスの配列。省略時は許可されたblob全件を取得する。
 * 指定時の件数・重複条件は呼び出し元で検証する。
 * @returns paths指定時は要求順のファイル情報、省略時はパスのUTF-8バイト順の全件ツリー。
 * いずれも同じコミットのSHA・生成日時・登録済み更新日時を含む。
 * @throws {ProblemException} 全件取得が100,000件またはUTF-8 JSON全体20 MiBを超える場合は422 SNAPSHOT_LIMIT_EXCEEDED。
 * @throws {HTTPException} パス不正は400、指定ファイルの不存在は404、GitHubの切り詰め・通信・応答検証の失敗は502、
 * 依存先の利用不可・回数制限やメタデータDBの未設定・読み取り失敗は503。
 */
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
  /**
   * 選択済みblobにコミット固定URLと登録済み更新日時を付け、公開スキーマで検証する。
   *
   * @param item GitHubのツリーから選択した、許可パスのblob項目。
   * @returns パス・SHA・サイズ・コミット固定raw URL・更新日時を持つファイル情報。
   * 更新日時が未登録の場合はnullとする。
   * @throws {HTTPException} 組み立てたファイル情報が公開スキーマに適合しない場合は502。
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
    const value = parseUpstream(treeSnapshotSchema.shape.items.element, { ...file(item), mode: item.mode, type: 'blob' });
    // 全体の巨大なJSONを作る前に、区切り文字を含む正確なUTF-8サイズを確認する。
    bytes += encoder.encode(JSON.stringify(value)).length + (items.length > 0 ? 1 : 0);
    if (bytes > 20971520) throw new ProblemException(422, 'SNAPSHOT_LIMIT_EXCEEDED');
    items.push(value);
  }
  return { ...snapshot, items };
}
