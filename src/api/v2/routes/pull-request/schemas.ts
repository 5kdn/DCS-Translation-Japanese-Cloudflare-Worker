/**
 * v2のPR公開スキーマと、GitHub応答の検証・変換を定義する。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import { dateTimeSchema, shaSchema } from '../common';
import { githubIssueSchema, issueSchema, toIssue } from '../issue/schemas';

/** Issue共通項目にマージ状態・ブランチ情報を加えたv2のPR応答。 */
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

/** PRのマージ情報とブランチ情報を含むGitHub側フィールド。 */
export const githubPrSchema = githubIssueSchema.extend({
  draft: z.boolean().optional(),
  merged_at: githubIssueSchema.shape.created_at.nullable(),
  head: z.object({ ref: z.string(), sha: shaSchema }),
  base: z.object({ ref: z.string() }),
});
/** 検証済みのGitHub PRを、マージ状態・ブランチ情報を含むv2応答へ変換する。 */
export const toPr = (value: z.infer<typeof githubPrSchema>): z.infer<typeof pullRequestSchema> => ({
  ...toIssue(value),
  draft: value.draft ?? false,
  merged: value.merged_at !== null,
  mergedAt: value.merged_at,
  headBranch: value.head.ref,
  baseBranch: value.base.ref,
  headSha: value.head.sha,
});
