import { createRoute } from '@hono/zod-openapi';
import { emptyRequest, failure, jsonMiddleware, numberParamSchema, readFailures } from '../common';
import { pullRequestSchema } from './schemas';

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
