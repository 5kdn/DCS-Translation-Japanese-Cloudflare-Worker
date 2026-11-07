/**
 * Issue詳細の契約と、GitHubからの取得・応答処理を提供する。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/types/env';
import { getGitHubContext, githubRequest } from '../../githubAdapter';
import { emptyRequest, failure, jsonMiddleware, numberParamSchema, readFailures } from '../common';
import { githubIssueSchema, issueSchema, toIssue } from './schemas';

/** 認証不要のIssue詳細操作のOpenAPI定義。 */
export const getIssue = createRoute({
  operationId: 'getIssue',
  method: 'get',
  path: '/issues/{number}',
  security: [],
  middleware: jsonMiddleware,
  request: { ...emptyRequest, params: numberParamSchema },
  responses: {
    200: { description: 'Issueの詳細。', content: { 'application/json': { schema: issueSchema } } },
    ...readFailures,
    404: failure,
  },
});

/**
 * Issue詳細を取得し、対象がPRの場合も404として扱う。
 * @param c 検証済み番号とWorkerのバインディングを持つリクエストコンテキスト。
 * @returns 日時をUTC・ミリ秒精度に正規化した詳細のJSON応答。
 * @throws {HTTPException} 対象不存在・種別不一致は404、GitHubの障害は502または503。
 */
export const getIssueHandler: RouteHandler<typeof getIssue, AppEnv> = async (c) => {
  const { octokit, owner, repo } = await getGitHubContext(c.env);
  const number = c.req.valid('param').number;
  const value = await githubRequest(
    async () => githubIssueSchema.parse((await octokit.rest.issues.get({ owner, repo, issue_number: number })).data),
    true,
  );
  if (value.pull_request !== undefined) throw new HTTPException(404);
  return c.json(toIssue(value), 200);
};
