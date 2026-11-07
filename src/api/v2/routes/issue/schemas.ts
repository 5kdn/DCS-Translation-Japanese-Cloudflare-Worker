/**
 * v2のIssue公開スキーマと、GitHub応答の検証・変換を定義する。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import { dateTimeSchema, numberSchema } from '../common';

/** v2で公開するIssueのフィールドと日時形式。 */
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

/** GitHubのRFC 3339日時をUTC・ミリ秒精度へ正規化する。 */
const timestamp = dateTimeSchema.transform((value) => new Date(value).toISOString());
/** Issueの公開応答とPRの識別に必要なGitHub側フィールド。 */
export const githubIssueSchema = z.object({
  number: numberSchema,
  title: z.string(),
  body: z.string().nullish(),
  state: z.enum(['open', 'closed']),
  html_url: z.url(),
  created_at: timestamp,
  updated_at: timestamp,
  closed_at: timestamp.nullable(),
  pull_request: z.unknown().optional(),
});
/** 検証・日時正規化済みのGitHub Issueを、v2の公開フィールドへ変換する。 */
export const toIssue = (value: z.infer<typeof githubIssueSchema>): z.infer<typeof issueSchema> => ({
  number: value.number,
  title: value.title,
  body: value.body ?? null,
  state: value.state,
  url: value.html_url,
  createdAt: value.created_at,
  updatedAt: value.updated_at,
  closedAt: value.closed_at,
});
