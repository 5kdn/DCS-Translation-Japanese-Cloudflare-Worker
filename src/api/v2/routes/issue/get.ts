import { createRoute } from '@hono/zod-openapi';
import { emptyRequest, failure, jsonMiddleware, numberParamSchema, readFailures } from '../common';
import { issueSchema } from './schemas';

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
