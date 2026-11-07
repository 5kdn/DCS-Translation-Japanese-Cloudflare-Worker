import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/types/env';
import { getGitHubContext, githubRequest } from '../../githubAdapter';
import { validRepositoryPath } from '../../paths';
import { bodyMiddleware, emptyRequest, numberSchema, pathSchema, shaSchema, titleSchema, writeFailures } from '../common';

/**
 * ファイルの追加・更新内容を検証するZodスキーマ。
 *
 * パスと文字列の内容を必須とし、operationはupsertまたは省略を受け付ける。
 * 各項目の長さを検証し、未定義の項目は拒否する。
 * OpenAPIではFileUpsertとして公開する。
 */
const fileUpsertSchema = z
  .strictObject({
    path: pathSchema,
    operation: z.literal('upsert').openapi({ default: 'upsert' }).optional(),
    content: z.string().max(1048576),
  })
  .openapi('FileUpsert');

/**
 * ファイルの削除指定を検証するZodスキーマ。
 *
 * パスとoperationのdelete指定を必須とし、内容などの未定義項目は拒否する。
 * OpenAPIではFileDeleteとして公開する。
 */
const fileDeleteSchema = z
  .strictObject({
    path: pathSchema,
    operation: z.literal('delete'),
  })
  .openapi('FileDelete');

/**
 * PR作成リクエストの本文を検証するZodスキーマ。
 *
 * PRタイトル・ブランチ名・1〜100件のファイル変更を必須とする。
 * PR本文・コミットメッセージは任意とし、各項目の長さとファイル変更の形式を検証する。
 * 未定義の項目は拒否し、OpenAPIではPullRequestCreateとして公開する。
 */
export const pullRequestCreateSchema = z
  .strictObject({
    prTitle: titleSchema,
    prBody: z.string().max(65536).optional(),
    branchName: z.string().min(1).max(255),
    commitMessage: z.string().min(1).max(65536).optional(),
    files: z
      .array(z.union([fileUpsertSchema, fileDeleteSchema]))
      .min(1)
      .max(100),
  })
  .openapi('PullRequestCreate');

/**
 * PR作成・再利用の成功応答を検証するZodスキーマ。
 *
 * PR番号・URL・ブランチ名・コミットSHA・既存PRの再利用フラグを必須とする。
 * 未定義の項目は拒否し、OpenAPIではPullRequestCreationとして公開する。
 */
export const pullRequestCreationSchema = z
  .strictObject({
    number: numberSchema,
    url: z.url(),
    branchName: z.string(),

    commitSha: shaSchema,
    reused: z.boolean(),
  })
  .openapi('PullRequestCreation');

/**
 * 認証不要のPR作成操作（POST /v2/prs）のOpenAPIルート定義。
 *
 * JSONの本文をpullRequestCreateSchemaで検証し、成功時はPRの作成・再利用結果を200で返す。
 * 共有回数制限の超過を含む、書き込み操作の失敗応答も定義する。
 *
 * @remarks
 * リクエスト本文（application/json）:
 * - prTitle: PRタイトル（必須、1〜256文字）。
 * - prBody: PR本文（任意、65536文字以下）。省略時はGitHubへの作成リクエストに含めない。
 * - branchName: 新規作成するブランチ名（必須、1〜255文字）。既定ブランチ名は指定できない。
 * - commitMessage: コミットメッセージ（任意、1〜65536文字）。省略時はprTitleを使用する。
 * - files: ファイル変更の配列（必須、1〜100件）。各要素のpathは必須で、重複は許可しない。
 *   operationはupsertまたはdeleteで、省略時はupsertとして扱う。
 *   upsertではcontent（1048576文字以下）を必須とし、deleteではcontentを指定できない。
 */
export const createPullRequest = createRoute({
  operationId: 'createPullRequest',
  method: 'post',
  path: '/prs',
  security: [],
  middleware: bodyMiddleware,
  request: {
    ...emptyRequest,
    body: { required: true, content: { 'application/json': { schema: pullRequestCreateSchema } } },
  },
  responses: {
    200: { description: '作成・再利用したPR。', content: { 'application/json': { schema: pullRequestCreationSchema } } },
    ...writeFailures,
  },
});

/**
 * ブランチ名に禁止された文字・並び・セグメントが含まれていないか判定する。
 *
 * @param branch 検証するブランチ名（refs/heads/を含まない）。
 * @returns 制御文字・空白・Gitで禁止された記号や並び、空セグメントなどを含まず、
 * 先頭のハイフン・末尾のドット・ドットで始まるセグメント・.lockで終わるセグメントがない場合はtrue。
 */
const validBranch = (branch: string): boolean =>
  branch !== '@' &&
  !branch.startsWith('-') &&
  !branch.endsWith('.') &&
  !branch.includes('..') &&
  !branch.includes('@{') &&
  !Array.from(branch).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || '~^:?*[\\'.includes(char)) &&
  branch.split('/').every((part) => part !== '' && !part.startsWith('.') && !part.endsWith('.lock'));

/**
 * 設定されたベースから新規ブランチとコミットを作成し、ファイル差分のPRを作成する。
 *
 * ファイルパス・ブランチ名・パスの重複を検証し、既存ブランチへの上書きとforce pushは行わない。
 * PR作成が422で拒否された場合は、同じheadとbaseのopen状態のPRを検索して再利用する。
 * 途中で処理が失敗しても、作成済みのブランチやコミットは削除しない。
 *
 * @param c Honoのリクエストコンテキスト。c.envからGitHub接続設定を取得し、
 * c.req.valid('json')から次の検証済み入力を取得する。
 * - prTitle: PRタイトル（必須）。コミットメッセージ省略時にも使用する。
 * - prBody: PR本文（任意）。省略時はGitHubへの作成リクエストに含めない。
 * - branchName: 新規作成するブランチ名（必須）。既定ブランチ名は指定できない。
 * - commitMessage: コミットメッセージ（任意）。省略時はprTitleを使用する。
 * - files: 1〜100件のファイル変更（必須）。各要素にpathと、追加・更新時のcontentを指定する。
 *   operationはupsertまたはdeleteで、省略時は追加・更新として扱う。delete時はcontentを指定できない。
 * @returns PRの作成・再利用結果を公開スキーマへ変換した、ステータス200のJSON応答。
 * @throws {HTTPException} 不正なファイルパスは400、GitHubの権限不足は403、
 * ブランチ作成時の422応答や競合は409、不正なブランチ名・パスの重複・内容不整合は422、
 * 通信・応答検証の失敗は502、依存先の利用不可・回数制限は503。
 */
export const createPullRequestHandler: RouteHandler<typeof createPullRequest, AppEnv> = async (c) => {
  const payload = c.req.valid('json');
  if (!payload.files.every((file) => validRepositoryPath(file.path))) throw new HTTPException(400);
  if (!validBranch(payload.branchName) || new Set(payload.files.map((file) => file.path)).size !== payload.files.length) {
    throw new HTTPException(422);
  }
  const { octokit, owner, repo, defaultBranch } = await getGitHubContext(c.env);
  if (payload.branchName === defaultBranch) throw new HTTPException(422);
  const result = await githubRequest(
    async () => {
      const base = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
      const parentSha = shaSchema.parse(base.data.object.sha);
      const commit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: parentSha });
      const baseTree = shaSchema.parse(commit.data.tree.sha);
      try {
        await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${payload.branchName}`, sha: parentSha });
      } catch (error) {
        if (z.object({ status: z.literal(422) }).safeParse(error).success) throw new HTTPException(409);
        throw error;
      }
      const tree = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTree,
        tree: payload.files.map((file) =>
          file.operation === 'delete'
            ? { path: file.path, mode: '100644', type: 'blob', sha: null }
            : { path: file.path, mode: '100644', type: 'blob', content: file.content },
        ),
      });
      const next = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: payload.commitMessage ?? payload.prTitle,
        tree: shaSchema.parse(tree.data.sha),
        parents: [parentSha],
      });
      const commitSha = shaSchema.parse(next.data.sha);
      await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${payload.branchName}`, sha: commitSha, force: false });
      let pr: { number: number; html_url: string };
      let reused = false;
      try {
        pr = (
          await octokit.rest.pulls.create({
            owner,
            repo,
            head: payload.branchName,
            base: defaultBranch,
            title: payload.prTitle,
            ...(payload.prBody === undefined ? {} : { body: payload.prBody }),
          })
        ).data;
      } catch (error) {
        if (!z.object({ status: z.literal(422) }).safeParse(error).success) throw error;
        const existing = await octokit.rest.pulls.list({
          owner,
          repo,
          state: 'open',
          head: `${owner}:${payload.branchName}`,
          base: defaultBranch,
        });
        const first = existing.data[0];
        if (!first) throw error;
        pr = first;
        reused = true;
      }
      return pullRequestCreationSchema.parse({
        number: pr.number,
        url: pr.html_url,
        branchName: payload.branchName,
        commitSha,
        reused,
      });
    },
    false,
    true,
  );
  return c.json(result, 200);
};
