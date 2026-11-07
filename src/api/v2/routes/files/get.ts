/**
 * 指定ファイルの情報・コミット固定URLを返す操作の契約とハンドラー。
 * @packageDocumentation
 */
import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { dateTimeSchema, failure, jsonMiddleware, pathSchema, readFailures, shaSchema } from '../common';
import { getSnapshot } from '../tree/get';
import { fileSchema } from './schemas';

/** 要求順のファイル情報と、取得時のコミット・生成日時を持つ公開応答。 */
export const filesSchema = z

  .strictObject({
    commitSha: shaSchema,
    generatedAt: dateTimeSchema,
    files: z.array(fileSchema).min(1).max(100),
  })
  .openapi('Files');

/** 重複のない1〜100件のpathを、繰り返しクエリとして受け付ける。 */
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

/** 認証不要のファイル情報取得操作のOpenAPI定義。 */
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

/**
 * 指定されたパス順に、同じコミットのファイル情報とraw URLを返す。
 * @param c 検証済みpathとWorkerのバインディングを持つリクエストコンテキスト。
 * @returns コミット固定のファイル情報を含むJSON応答。
 * @throws {HTTPException} 不正なパスは400、存在しないファイルが1件でもあれば404。
 */
export const getFilesHandler: RouteHandler<typeof getFiles, AppEnv> = async (c) =>
  c.json(await getSnapshot(c.env, c.req.valid('query').path), 200);
