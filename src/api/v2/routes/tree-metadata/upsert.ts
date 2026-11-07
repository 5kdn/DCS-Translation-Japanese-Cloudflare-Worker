import { createRoute, type RouteHandler, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { errors } from 'jose';
import { ClaimValidationError, JwtReplayError } from '@/errors/claimValidationError';
import { getRequiredEnvD1Database, getRequiredEnvString } from '@/helpers/environmentHelper';
import { JwtVerificationService } from '@/services/jwtVerificationService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv } from '@/types/env';
import { ProblemException } from '../../app';
import { validRepositoryPath } from '../../paths';
import { bodyMiddleware, dateTimeSchema, emptyRequest, failure, pathSchema, writeFailures } from '../common';

/**
 * リポジトリ相対パスとRFC 3339形式の更新日時を受け付けるスキーマ。
 * パスの安全性・重複・日時の許容範囲はハンドラーで検証する。
 */
const metadataEntrySchema = z
  .strictObject({
    path: pathSchema,
    updatedAt: dateTimeSchema,
  })
  .openapi('MetadataEntry');

/** メタデータ一括更新の本文。更新対象を1〜1000件の配列で受け付ける。 */
export const metadataUpdateSchema = z.array(metadataEntrySchema).min(1).max(1000).openapi('MetadataUpdate');

/** 一括更新の成功応答。登録・更新した入力件数を返す。 */
export const metadataResultSchema = z
  .strictObject({
    updatedCount: z.number().int().min(1).max(1000),
  })
  .openapi('MetadataResult');

/**
 * PATCH /v2/tree-metadataのOpenAPIルート定義。
 * GitHub ActionsのOIDC認証を必須とし、失敗応答はProblem Detailsで定義する。
 * この操作は公開書き込み3操作の共有回数枠には含めない。
 */
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

/**
 * 共通エラーハンドラーが認証案内ヘッダーを維持して返す401例外を作成する。
 * @returns WWW-Authenticateヘッダーを持つHTTP例外。
 */
const unauthenticated = (): HTTPException =>
  new HTTPException(401, {
    res: new Response(null, {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="tree-metadata", error="invalid_token"' },
    }),
  });

/**
 * OIDCトークンを検証・消費し、指定パスのメタデータを原子的に登録・更新する。
 *
 * 署名・issuer・audience・期待クレームを検証し、jtiの消費記録は旧APIと共有する。
 * パスの安全性と重複、更新日時が現在から1時間前までの範囲内（両端を含む）かを検証する。
 * RFC 3339形式の日時はepochミリ秒へ変換し、ミリ秒未満を切り捨てて保存する。
 * 全件を1つのトランザクションで保存するため、一部だけの更新や既存データの削除は行わない。
 * jtiの記録後に入力検証や保存が失敗しても消費記録は残り、再試行には新しいトークンが必要。
 *
 * @param c スキーマ検証済みのJSON本文、認証ヘッダー、Workerのバインディングを持つコンテキスト。
 * @returns 更新件数を含むステータス200のJSON応答。
 * @throws {HTTPException} パス・重複・日時の不正は400、トークン不正は401、期待クレーム不一致は403。
 * @throws {ProblemException} トークンの再利用は409（REPLAY_DETECTED）。
 */
export const upsertTreeMetadataHandler: RouteHandler<typeof upsertTreeMetadata, AppEnv> = async (c) => {
  const token = /^Bearer (?<token>[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(c.req.header('Authorization') ?? '')
    ?.groups?.token;
  if (!token) throw unauthenticated();

  const owner = getRequiredEnvString('TARGET_GH_OWNER', c.env.TARGET_GH_OWNER);
  const repo = getRequiredEnvString('TARGET_GH_REPO', c.env.TARGET_GH_REPO);
  const ref = `refs/heads/${getRequiredEnvString('TARGET_GH_DEFAULT_BRANCH', c.env.TARGET_GH_DEFAULT_BRANCH)}`;
  const subject = getRequiredEnvString('TREE_METADATA_OIDC_SUBJECT', c.env.TREE_METADATA_OIDC_SUBJECT);
  const replayDb = getRequiredEnvD1Database('JWT_REPLAY_DB', c.env.JWT_REPLAY_DB);
  const metadataDb = getRequiredEnvD1Database('TREE_METADATA_DB', c.env.TREE_METADATA_DB);
  const workflow = `${owner}/${repo}/.github/workflows/tree-metadata-sender.yml@${ref}`;
  try {
    await new JwtVerificationService(replayDb).verifyGithubActionsIdToken(token, 'tree-metadata', {
      sub: subject,
      repository: `${owner}/${repo}`,
      repository_owner: owner,
      ref,
      job_workflow_ref: workflow,
      workflow_ref: workflow,
    });
  } catch (error) {
    if (error instanceof JwtReplayError) throw new ProblemException(409, 'REPLAY_DETECTED');
    if (error instanceof ClaimValidationError) {
      if (error.claim === 'jti' || error.claim === 'exp') throw unauthenticated();
      throw new HTTPException(403);
    }
    if (error instanceof errors.JOSEError) throw unauthenticated();
    throw error;
  }

  const entries = c.req.valid('json');
  const now = Date.now();
  const paths = new Set<string>();
  const files = entries.map(({ path, updatedAt }) => {
    const time = Date.parse(updatedAt);
    if (!validRepositoryPath(path) || paths.has(path) || time < now - 3600000 || time > now) {
      throw new HTTPException(400);
    }
    paths.add(path);
    return { path, updatedAt: time };
  });
  await new TreePathUpdatedAtService(metadataDb).upsertAtomic(files);
  return c.json({ updatedCount: files.length }, 200);
};
