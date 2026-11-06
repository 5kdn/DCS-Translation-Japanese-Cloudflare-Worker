import { createRoute, z } from '@hono/zod-openapi';
import { jsonMiddleware, listQuerySchema, pageSchema, readFailures } from '../common';
import { pullRequestSchema } from './schemas';

export const pullRequestPageSchema = z
  .strictObject({
    items: z.array(pullRequestSchema).max(100),
    page: pageSchema,
  })
  .openapi('PullRequestPage');

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
