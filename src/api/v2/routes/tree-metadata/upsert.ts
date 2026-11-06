import { createRoute, z } from '@hono/zod-openapi';
import { bodyMiddleware, dateTimeSchema, emptyRequest, failure, pathSchema, writeFailures } from '../common';

const metadataEntrySchema = z
  .strictObject({
    path: pathSchema,
    updatedAt: dateTimeSchema,
  })
  .openapi('MetadataEntry');

export const metadataUpdateSchema = z.array(metadataEntrySchema).min(1).max(1000).openapi('MetadataUpdate');

export const metadataResultSchema = z
  .strictObject({
    updatedCount: z.number().int().min(1).max(1000),
  })
  .openapi('MetadataResult');

export const upsertTreeMetadata = createRoute({
  operationId: 'upsertTreeMetadata',
  method: 'patch',
  path: '/tree-metadata',
  security: [{ githubActionsOidc: [] }],
  middleware: bodyMiddleware,
  request: { ...emptyRequest, body: { required: true, content: { 'application/json': { schema: metadataUpdateSchema } } } },
  responses: {
    200: { description: '更新した件数。', content: { 'application/json': { schema: metadataResultSchema } } },
    ...writeFailures,
    401: {
      ...failure,
      headers: z.object({
        'WWW-Authenticate': z
          .string()
          .openapi({ param: { description: 'Bearer認証の要求（realm="tree-metadata"、error="invalid_token"）。' } }),
      }),
    },
    403: failure,
  },
});
