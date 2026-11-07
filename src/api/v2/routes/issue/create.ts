import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { getGitHubContext, githubRequest } from '../../githubAdapter';
import { bodyMiddleware, emptyRequest, titleSchema, writeFailures } from '../common';
import { githubIssueSchema, issueSchema, toIssue } from './schemas';

/**
 * Issue作成リクエストの本文を検証するZodスキーマ。
 *
 * タイトルを必須とし、本文・ラベル・担当者は任意で受け付ける。
 * 各項目の長さ・件数と、ラベル・担当者の重複を検証し、未定義の項目は拒否する。
 * OpenAPIではIssueCreateとして公開する。
 */
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

/**
 * 認証不要のIssue作成操作（POST /v2/issues）のOpenAPIルート定義。
 *
 * JSONの本文をissueCreateSchemaで検証し、成功時は作成したIssueを201で返す。
 * 共有回数制限の超過を含む、書き込み操作の失敗応答も定義する。
 */
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

/**
 * 設定済みリポジトリへ、認証不要でIssueを作成する。
 *
 * @param c 検証済みの作成内容とWorkerのバインディングを持つリクエストコンテキスト。
 * @returns 作成したIssueを公開スキーマへ変換した、ステータス201のJSON応答。
 * @throws {HTTPException} GitHubの権限不足は403、競合は409、内容不整合は422、
 * 通信・応答検証の失敗は502、依存先の利用不可・回数制限は503。
 */
export const createIssueHandler: RouteHandler<typeof createIssue, AppEnv> = async (c) => {
  const { octokit, owner, repo } = await getGitHubContext(c.env);
  const payload = c.req.valid('json');
  const value = await githubRequest(
    async () => githubIssueSchema.parse((await octokit.rest.issues.create({ owner, repo, ...payload })).data),
    false,
    true,
  );
  return c.json(toIssue(value), 201);
};
