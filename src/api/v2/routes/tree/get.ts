import { createRoute, z } from '@hono/zod-openapi';
import { dateTimeSchema, emptyRequest, failure, jsonMiddleware, readFailures, shaSchema } from '../common';
import { fileSchema } from '../files/schemas';

const treeItemSchema = z
  .strictObject({
    ...fileSchema.shape,
    mode: z.enum(['100644', '100755', '120000']),
    type: z.literal('blob'),
  })
  .openapi('TreeItem');

export const treeSnapshotSchema = z
  .strictObject({
    commitSha: shaSchema,
    generatedAt: dateTimeSchema,
    items: z.array(treeItemSchema).max(100000),
  })
  .openapi('TreeSnapshot');

export const getTree = createRoute({
  operationId: 'getTree',
  method: 'get',
  path: '/tree',
  security: [],
  middleware: jsonMiddleware,
  request: emptyRequest,
  responses: {
    200: { description: 'ツリーの全件スナップショット。', content: { 'application/json': { schema: treeSnapshotSchema } } },
    ...readFailures,
    422: failure,
  },
});
