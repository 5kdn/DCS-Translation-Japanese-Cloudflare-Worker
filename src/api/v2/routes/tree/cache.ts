/**
 * 最新コミットとSHA固定のGitHubツリーを、Cloudflare Cache APIで共有する。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import type { GitHubContext } from '@/services/githubService';
import { githubRequest } from '../../githubAdapter';
import { shaSchema } from '../common';

/** GitHubの完全なツリー。公開応答への変換前に検証する。 */
const treeSchema = z.object({
  truncated: z.literal(false),
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
 * 有効なキャッシュを返し、未保存・期限切れ・破損・障害時は取得し直す。
 * キャッシュの読み書きに失敗しても取得結果は返すが、取得自体の失敗は呼び出し元へ伝える。
 * @typeParam T キャッシュに保存する、スキーマ検証済みの値の型。
 * @param key リポジトリ・ブランチまたはコミットを識別する内部URL。
 * @param schema 保存値の形式を検証するスキーマ。
 * @param seconds 保持期間の上限秒数。取得開始時から有効期限を計算する。
 * @param load キャッシュを使えない場合に依存先から値を取得する処理。
 * @returns 有効なキャッシュの値、または再取得した値。
 * @throws loadが返したエラー。取得失敗時に古い値や部分的な値で代用しない。
 */
const cached = async <T>(key: string, schema: z.ZodType<T>, seconds: number, load: () => Promise<T>): Promise<T> => {
  const entrySchema = z.object({ expiresAt: z.number(), value: schema });
  try {
    const response = await (await caches.open('v2-tree')).match(key);
    if (response) {
      const entry = entrySchema.parse(await response.json());
      if (entry.expiresAt > Date.now()) return entry.value;
    }
  } catch (error) {
    console.warn('[tree-cache] read failed', error);
  }
  const expiresAt = Date.now() + seconds * 1000;
  const value = await load();
  try {
    await (await caches.open('v2-tree')).put(
      key,
      Response.json(
        { expiresAt, value },
        {
          headers: { 'Cache-Control': `public, max-age=${seconds}` },
        },
      ),
    );
  } catch (error) {
    console.warn('[tree-cache] write failed', error);
  }
  return value;
};

/**
 * 最新コミットは60秒、SHA固定のGitHubツリーは1年間、同じデータセンター内で共有する。
 * options省略時はキャッシュを使わず、filesの従来の取得方式を維持する。
 * @param ctx GitHubクライアントと対象リポジトリ・既定ブランチの情報。
 * @param options キャッシュキー用originと、継続取得で固定する任意のコミットSHA。
 * commitSha省略時は既定ブランチから解決し、指定時は最新ブランチを確認しない。
 * @returns 取得対象のコミットSHAと、切り詰められていない完全なGitHubツリー。
 * @throws {HTTPException} GitHubの切り詰め・不正応答・取得失敗は502、利用不可・回数制限は503。
 */
export const loadTree = async (
  ctx: GitHubContext,
  options?: { origin: string; commitSha?: string },
): Promise<{ commitSha: string; tree: z.infer<typeof treeSchema> }> => {
  const { octokit, owner, repo, defaultBranch } = ctx;
  const prefix = options ? `${options.origin}/__tree-cache/v1/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/` : '';
  const loadHead = () =>
    githubRequest(
      async () =>
        z
          .object({ commit: z.object({ sha: shaSchema }) })
          .parse((await octokit.rest.repos.getBranch({ owner, repo, branch: defaultBranch })).data).commit.sha,
    );
  const commitSha =
    options?.commitSha ??
    (options
      ? await cached(`${prefix}branch/${encodeURIComponent(defaultBranch)}`, shaSchema, 60, loadHead)
      : await loadHead());
  const load = () =>
    githubRequest(async () =>
      treeSchema.parse((await octokit.rest.git.getTree({ owner, repo, tree_sha: commitSha, recursive: 'true' })).data),
    );
  const tree = options ? await cached(`${prefix}tree/${commitSha}`, treeSchema, 31536000, load) : await load();
  return { commitSha, tree };
};
