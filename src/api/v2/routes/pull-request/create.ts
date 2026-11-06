import { createRoute, z } from '@hono/zod-openapi';
import { bodyMiddleware, emptyRequest, numberSchema, pathSchema, shaSchema, titleSchema, writeFailures } from '../common';

const fileUpsertSchema = z
  .strictObject({
    path: pathSchema,
    operation: z.literal('upsert').openapi({ default: 'upsert' }).optional(),
    content: z.string().max(1048576),
  })
  .openapi('FileUpsert');

const fileDeleteSchema = z

  .strictObject({
    path: pathSchema,
    operation: z.literal('delete'),
  })
  .openapi('FileDelete');

export const pullRequestCreateSchema = z
  .strictObject({
    prTitle: titleSchema,
    prBody: z.string().max(65536).optional(),
    branchName: z.string().min(1).max(255),
    commitMessage: z.string().min(1).max(65536).optional(),
    files: z
      .array(z.union([fileUpsertSchema, fileDeleteSchema]))
      .min(1)
      .max(100),
  })

  .openapi('PullRequestCreate');

export const pullRequestCreationSchema = z
  .strictObject({
    number: numberSchema,
    url: z.url(),
    branchName: z.string(),

    commitSha: shaSchema,
    reused: z.boolean(),
  })
  .openapi('PullRequestCreation');

export const createPullRequest = createRoute({
  operationId: 'createPullRequest',
  method: 'post',
  path: '/prs',
  security: [],
  middleware: bodyMiddleware,
  request: {
    ...emptyRequest,
    body: { required: true, content: { 'application/json': { schema: pullRequestCreateSchema } } },
  },
  responses: {
    200: { description: '作成・再利用したPR。', content: { 'application/json': { schema: pullRequestCreationSchema } } },
    ...writeFailures,
  },
});
