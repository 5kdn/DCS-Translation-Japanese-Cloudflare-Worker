import { z } from '@hono/zod-openapi';
import { dateTimeSchema, pathSchema, shaSchema } from '../common';

export const fileSchema = z
  .strictObject({
    path: pathSchema,
    url: z.url(),
    sha: shaSchema,
    size: z.number().int().min(0),
    updatedAt: dateTimeSchema.nullable(),
  })
  .openapi('File');
