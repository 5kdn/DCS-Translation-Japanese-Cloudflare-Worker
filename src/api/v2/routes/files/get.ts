import { createRoute, z } from '@hono/zod-openapi';
import { dateTimeSchema, failure, jsonMiddleware, pathSchema, readFailures, shaSchema } from '../common';
import { fileSchema } from './schemas';

export const filesSchema = z

  .strictObject({
    commitSha: shaSchema,
    generatedAt: dateTimeSchema,
    files: z.array(fileSchema).min(1).max(100),
  })
  .openapi('Files');

export const filesQuerySchema = z.strictObject({
  path: z.preprocess(
    (value) => (typeof value === 'string' ? [value] : value),

    z
      .array(pathSchema)
      .min(1)
      .max(100)
      .refine((values) => new Set(values).size === values.length)
      .openapi({ uniqueItems: true }),
  ),
});

export const getFiles = createRoute({
  operationId: 'getFiles',
  method: 'get',
  path: '/files',

  security: [],
  middleware: jsonMiddleware,
  request: { query: filesQuerySchema },
  responses: {
    200: { description: 'ファイル情報とダウンロードURL。', content: { 'application/json': { schema: filesSchema } } },
    ...readFailures,
    404: failure,
  },
});
