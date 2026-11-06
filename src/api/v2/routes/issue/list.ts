import { createRoute, z } from '@hono/zod-openapi';
import { jsonMiddleware, listQuerySchema, pageSchema, readFailures } from '../common';
import { issueSchema } from './schemas';

export const issuePageSchema = z
  .strictObject({
    items: z.array(issueSchema).max(100),
    page: pageSchema,
  })
  .openapi('IssuePage');

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
