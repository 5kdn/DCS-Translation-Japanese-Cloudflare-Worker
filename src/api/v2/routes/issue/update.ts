import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/types/env';
import { getGitHubContext, githubRequest } from '../../githubAdapter';
import { bodyMiddleware, emptyRequest, failure, numberParamSchema, titleSchema, writeFailures } from '../common';
import { githubIssueSchema, issueSchema, toIssue } from './schemas';

/**
 * Issue編集リクエストの本文を検証するZodスキーマ。
 *
 * タイトル・本文の少なくとも一方を必須とし、各項目の長さを検証する。
 * ラベル・担当者・状態など、未定義の項目は拒否する。
 * OpenAPIではIssueUpdateとして公開する。
 */
export const issueUpdateSchema = z
  .strictObject({
    title: titleSchema.optional(),
    body: z.string().max(65536).optional(),
  })
  .refine((value) => Object.keys(value).length > 0)
  .openapi('IssueUpdate', { minProperties: 1 });

/**
 * 認証不要のIssue編集操作（PATCH /v2/issues/{number}）のOpenAPIルート定義。
 *
 * Issue番号とJSONの本文を検証し、成功時は編集後のIssueを200で返す。
 * 対象不存在の404と、共有回数制限の超過を含む書き込み操作の失敗応答を定義する。
 */
export const updateIssue = createRoute({
  operationId: 'updateIssue',
  method: 'patch',
  path: '/issues/{number}',
  security: [],
  middleware: bodyMiddleware,
  request: {
    ...emptyRequest,
    params: numberParamSchema,
    body: { required: true, content: { 'application/json': { schema: issueUpdateSchema } } },
  },
  responses: {
    200: { description: '編集後のIssue。', content: { 'application/json': { schema: issueSchema } } },
    ...writeFailures,

    404: failure,
  },
});

/**
 * 作成経路・状態に関係なくIssueのタイトル・本文だけを編集し、PRは拒否する。
 *
 * @param c 検証済みのIssue番号・編集内容とWorkerのバインディングを持つリクエストコンテキスト。
 * @returns 編集後のIssueを公開スキーマへ変換した、ステータス200のJSON応答。
 * @throws {HTTPException} 対象不存在・対象がPRの場合は404、GitHubの権限不足は403、
 * 競合は409、内容不整合は422、通信・応答検証の失敗は502、依存先の利用不可・回数制限は503。
 */
export const updateIssueHandler: RouteHandler<typeof updateIssue, AppEnv> = async (c) => {
  const { octokit, owner, repo } = await getGitHubContext(c.env);
  const issue_number = c.req.valid('param').number;
  const current = await githubRequest(
    async () => githubIssueSchema.parse((await octokit.rest.issues.get({ owner, repo, issue_number })).data),
    true,
    true,
  );
  if (current.pull_request !== undefined) throw new HTTPException(404);
  const value = await githubRequest(
    async () =>
      githubIssueSchema.parse((await octokit.rest.issues.update({ owner, repo, issue_number, ...c.req.valid('json') })).data),
    true,
    true,
  );
  return c.json(toIssue(value), 200);
};
