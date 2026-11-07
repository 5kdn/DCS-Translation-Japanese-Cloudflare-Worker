/**
 * Issue一覧の契約と、GitHubからの取得・応答処理を提供する。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { paginate } from '../../pagination';
import { jsonMiddleware, listQuerySchema, pageSchema, readFailures } from '../common';
import { githubIssueSchema, issueSchema, toIssue } from './schemas';

/** 最大100件の一覧と次ページのcursorを持つ公開応答。 */
export const issuePageSchema = z
  .strictObject({
    items: z.array(issueSchema).max(100),
    page: pageSchema,
  })
  .openapi('IssuePage');

/** 認証不要のIssue一覧操作のOpenAPI定義。 */
export const listIssues = createRoute({
  operationId: 'listIssues',
  method: 'get',
  path: '/issues',
  security: [],
  middleware: jsonMiddleware,
  request: { query: listQuerySchema },
  responses: {
    200: { description: 'Issue一覧。', content: { 'application/json': { schema: issuePageSchema } } },
    ...readFailures,
  },
});

/**
 * GitHubの一覧からPRを除外し、Issueを署名付きcursorでページングして返す。
 * @param c 検証済みクエリとWorkerのバインディングを持つリクエストコンテキスト。
 * @returns OASに従う一覧と次ページのcursorを含むJSON応答。
 */
export const listIssuesHandler: RouteHandler<typeof listIssues, AppEnv> = async (c) =>
  c.json(
    await paginate(c.env, 'issues', c.req.valid('query'), async ({ octokit }, params) => {
      const entries = z.array(githubIssueSchema).parse((await octokit.rest.issues.listForRepo(params)).data);
      return {
        count: entries.length,
        dates: entries.map((entry) => entry.created_at),
        items: entries.filter((entry) => entry.pull_request === undefined).map(toIssue),
      };
    }),
    200,
  );
