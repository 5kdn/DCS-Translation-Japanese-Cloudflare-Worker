import { createRoute, z } from '@hono/zod-openapi';
import { bodyMiddleware, emptyRequest, failure, numberParamSchema, titleSchema, writeFailures } from '../common';
import { issueSchema } from './schemas';

export const issueUpdateSchema = z
  .strictObject({
    title: titleSchema.optional(),
    body: z.string().max(65536).optional(),
  })
  .refine((value) => Object.keys(value).length > 0)
  .openapi('IssueUpdate', { minProperties: 1 });

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
