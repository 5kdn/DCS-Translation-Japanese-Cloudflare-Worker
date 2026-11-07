/**
 * PR詳細の契約と、GitHubからの取得・応答処理を提供する。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { getGitHubContext, githubRequest } from '../../githubAdapter';
import { emptyRequest, failure, jsonMiddleware, numberParamSchema, readFailures } from '../common';
import { githubPrSchema, pullRequestSchema, toPr } from './schemas';

/** 認証不要のPR詳細操作のOpenAPI定義。 */
export const getPullRequest = createRoute({
  operationId: 'getPullRequest',
  method: 'get',
  path: '/prs/{number}',
  security: [],
  middleware: jsonMiddleware,
  request: { ...emptyRequest, params: numberParamSchema },
  responses: {
    200: { description: 'PRの詳細。', content: { 'application/json': { schema: pullRequestSchema } } },
    ...readFailures,

    404: failure,
  },
});

/**
 * マージ状態とブランチ情報を含むPR詳細を取得する。
 * @param c 検証済み番号とWorkerのバインディングを持つリクエストコンテキスト。
 * @returns 日時をUTC・ミリ秒精度に正規化した詳細のJSON応答。
 * @throws {HTTPException} 対象不存在は404、GitHubの障害は502または503。
 */
export const getPullRequestHandler: RouteHandler<typeof getPullRequest, AppEnv> = async (c) => {
  const { octokit, owner, repo } = await getGitHubContext(c.env);
  const number = c.req.valid('param').number;
  const value = await githubRequest(
    async () => githubPrSchema.parse((await octokit.rest.pulls.get({ owner, repo, pull_number: number })).data),
    true,
  );
  return c.json(toPr(value), 200);
};
