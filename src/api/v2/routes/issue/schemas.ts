import { z } from '@hono/zod-openapi';
import { dateTimeSchema, numberSchema } from '../common';

export const issueSchema = z
  .strictObject({
    number: numberSchema,
    title: z.string(),
    body: z.string().nullable(),
    state: z.enum(['open', 'closed']),
    url: z.url(),
    createdAt: dateTimeSchema,
    updatedAt: dateTimeSchema,
    closedAt: dateTimeSchema.nullable(),
  })
  .openapi('Issue');
