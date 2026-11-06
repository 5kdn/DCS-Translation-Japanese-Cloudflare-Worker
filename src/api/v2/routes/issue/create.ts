import { createRoute, z } from '@hono/zod-openapi';
import { bodyMiddleware, emptyRequest, titleSchema, writeFailures } from '../common';
import { issueSchema } from './schemas';

export const issueCreateSchema = z
  .strictObject({
    title: titleSchema,
    body: z.string().max(65536).optional(),
    labels: z
      .array(z.string().min(1).max(50))
      .max(20)
      .refine((values) => new Set(values).size === values.length)
      .openapi({ uniqueItems: true })

      .optional(),
    assignees: z
      .array(z.string().min(1).max(39))
      .max(10)
      .refine((values) => new Set(values).size === values.length)

      .openapi({ uniqueItems: true })
      .optional(),
  })
  .openapi('IssueCreate');

export const createIssue = createRoute({
  operationId: 'createIssue',
  method: 'post',
  path: '/issues',
  security: [],
  middleware: bodyMiddleware,
  request: { ...emptyRequest, body: { required: true, content: { 'application/json': { schema: issueCreateSchema } } } },
  responses: {
    201: { description: '作成したIssue。', content: { 'application/json': { schema: issueSchema } } },

    ...writeFailures,
  },
});
