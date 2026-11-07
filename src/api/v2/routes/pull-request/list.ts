/**
 * PR一覧の契約と、GitHubからの取得・応答処理を提供する。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { paginate } from '../../pagination';
import { jsonMiddleware, listQuerySchema, pageSchema, readFailures } from '../common';
import { githubPrSchema, pullRequestSchema, toPr } from './schemas';

/** 最大100件の一覧と次ページのcursorを持つ公開応答。 */
export const pullRequestPageSchema = z
  .strictObject({
    items: z.array(pullRequestSchema).max(100),
    page: pageSchema,
  })
  .openapi('PullRequestPage');

/** 認証不要のPR一覧操作のOpenAPI定義。 */
export const listPullRequests = createRoute({
  operationId: 'listPullRequests',
  method: 'get',
  path: '/prs',
  security: [],
  middleware: jsonMiddleware,
  request: { query: listQuerySchema },
  responses: {
    200: { description: 'PR一覧。', content: { 'application/json': { schema: pullRequestPageSchema } } },
    ...readFailures,
  },
});

/**
 * PRを署名付きcursorでページングして返す。
 * @param c 検証済みクエリとWorkerのバインディングを持つリクエストコンテキスト。
 * @returns OASに従う一覧と次ページのcursorを含むJSON応答。
 */
export const listPullRequestsHandler: RouteHandler<typeof listPullRequests, AppEnv> = async (c) =>
  c.json(
    await paginate(c.env, 'prs', c.req.valid('query'), async ({ octokit }, params) => {
      const entries = z.array(githubPrSchema).parse((await octokit.rest.pulls.list(params)).data);
      return { count: entries.length, dates: entries.map((entry) => entry.created_at), items: entries.map(toPr) };
    }),
    200,
  );
