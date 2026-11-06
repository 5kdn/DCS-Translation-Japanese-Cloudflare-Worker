import { z } from '@hono/zod-openapi';
import { dateTimeSchema, shaSchema } from '../common';
import { issueSchema } from '../issue/schemas';

export const pullRequestSchema = z
  .strictObject({
    ...issueSchema.shape,
    draft: z.boolean(),
    merged: z.boolean(),
    mergedAt: dateTimeSchema.nullable(),
    headBranch: z.string(),
    baseBranch: z.string(),
    headSha: shaSchema,
  })
  .openapi('PullRequest');
