import { createRoute, type OpenAPIHono, type RouteConfigToTypedResponse, z } from '@hono/zod-openapi';
import { ClaimValidationError } from '@/errors/claimValidationError';
import { toUserFacingError, UserFacingError } from '@/errors/userFacingError';
import { getRequiredEnvD1Database, getRequiredEnvString } from '@/helpers/environmentHelper';
import { formatErrorMessage } from '@/helpers/httpErrorMessageHelper';
import { JwtVerificationService } from '@/services/jwtVerificationService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv } from '@/types/env';

/**
 * zod schemas
 */
const ApiResponseBase = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data: z.optional(z.nullable(data)),
    message: z.string().optional(),
  });

const MAX_REQUEST_ITEMS = 1000;
const MAX_PATH_BYTES = 4096;
const UPDATED_AT_WINDOW_MS = 60 * 60 * 1000;
const AUTHORIZATION_BEARER_PATTERN = /^Bearer\s+(?<token>[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;

const RequestSchema = z
  .array(
    z.object({
      path: z.string().refine((value) => new TextEncoder().encode(value).length <= MAX_PATH_BYTES, {
        message: `path は ${MAX_PATH_BYTES} バイト以内にする`,
      }),
      updatedAt: z
        .number()
        .int()
        .refine((value) => {
          const now = Date.now();
          return value >= now - UPDATED_AT_WINDOW_MS && value <= now;
        }, 'updatedAt は過去1時間以内の整数にする'),
    }),
  )
  .max(MAX_REQUEST_ITEMS, `配列の要素数は ${MAX_REQUEST_ITEMS} 件以内にする`);

const HeaderSchema = z.object({
  Authorization: z.string().min(1).optional(),
});

/** 成功時のレスポンススキーマ。 */
const SuccessResponseSchema = ApiResponseBase(z.null());

/** 失敗時のレスポンススキーマ。 */
const ErrorResponseSchema = ApiResponseBase(z.null());

type TreeMetadataUpsertRequest = z.infer<typeof RequestSchema>;
type TreeMetadataRouteResponse = RouteConfigToTypedResponse<typeof route>;

/**
 * OpenAPI route
 */
const route = createRoute({
  method: 'post',
  path: '/upsert',
  tags: ['tree-metadata'],
  summary: 'GitHub の ファイルの作成・更新日を更新する',
  description: 'GitHub の ファイルの作成・更新日を更新します。\n',
  request: {
    headers: HeaderSchema,
    body: {
      content: {
        'application/json': {
          schema: RequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'ok',
      content: { 'application/json': { schema: SuccessResponseSchema } },
    },
    400: {
      description: 'bad request',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    422: {
      description: 'unprocessable entity',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    500: {
      description: 'error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const registerTreeMetadataUpsertRoutes = (app: OpenAPIHono<AppEnv>) => {
  app.openapi(route, async (c): Promise<TreeMetadataRouteResponse> => {
    try {
      const raw_authorization = c.req.header('Authorization');
      if (!raw_authorization) {
        throw new UserFacingError(
          'INVALID_AUTHORIZATION',
          401,
          'Authorization ヘッダに有効な Bearer 形式の JWS(JWT) を指定してください。',
        );
      }
      const token = AUTHORIZATION_BEARER_PATTERN.exec(raw_authorization)?.groups?.token;
      if (!token) {
        throw new UserFacingError(
          'INVALID_AUTHORIZATION',
          401,
          'Authorization ヘッダに有効な Bearer 形式の JWS(JWT) を指定してください。',
        );
      }

      const owner = getRequiredEnvString('TARGET_GH_OWNER', c.env.TARGET_GH_OWNER);
      const repo = getRequiredEnvString('TARGET_GH_REPO', c.env.TARGET_GH_REPO);
      const defaultBranch = getRequiredEnvString('TARGET_GH_DEFAULT_BRANCH', c.env.TARGET_GH_DEFAULT_BRANCH);
      const ref = `refs/heads/${defaultBranch}`;
      const db = getRequiredEnvD1Database('JWT_REPLAY_DB', c.env.JWT_REPLAY_DB);

      const expectedClaims = {
        sub: `repo:${owner}/${repo}:pull_request`,
        repository: `${owner}/${repo}`,
        repository_owner: owner,
        ref,
        job_workflow_ref: `${owner}/${repo}/.github/workflows/tree-metadata-sender.yml@${ref}`,
        workflow_ref: `${owner}/${repo}/.github/workflows/tree-metadata-sender.yml@${ref}`,
      };
      const verifier = new JwtVerificationService(db);
      try {
        await verifier.verifyGithubActionsIdToken(token, 'tree-metadata', expectedClaims);
      } catch (err: unknown) {
        console.error(`Bearer Tokenの検証に失敗しました。\n${err}`);
        if (err instanceof ClaimValidationError) {
          throw new UserFacingError('FORBIDDEN', 403, '権限がありません。');
        }
        throw new UserFacingError(
          'INVALID_AUTHORIZATION',
          401,
          'Authorization ヘッダに有効な Bearer 形式の JWS(JWT) を指定してください。',
        );
      }
      console.info('Bearer Tokenを検証した');

      const request = c.req.valid('json') as z.infer<typeof RequestSchema>;
      await upsertTreeMetadataHandler(c.env, request);

      const body: z.infer<typeof SuccessResponseSchema> = {
        success: true,
        data: null,
      };
      return c.json<typeof body, 200>(body, 200);
    } catch (err: unknown) {
      const userError = toUserFacingError(err);
      const errBody: z.infer<typeof ErrorResponseSchema> = {
        success: false,
        data: null,
        message: formatErrorMessage(userError),
      };
      const status = toErrorStatus(userError.status);
      const respondError = <S extends ErrorStatus>(code: S) => c.json<typeof errBody, S>(errBody, code);
      switch (status) {
        case 400:
          return respondError(400);
        case 401:
          return respondError(401);
        case 403:
          return respondError(403);
        case 404:
          return respondError(404);
        case 422:
          return respondError(422);
        default:
          return respondError(500);
      }
    }
  });
};

/** internal */
/**
 * @summary D1 に tree_path_updatedAt を登録する。
 */
const upsertTreeMetadataHandler = async (
  env: AppEnv['Bindings'],
  req: TreeMetadataUpsertRequest,
): Promise<z.infer<typeof SuccessResponseSchema>['data']> => {
  if (!env.TREE_METADATA_DB) {
    throw new UserFacingError('MISSING_D1_BINDING', 500, 'D1の設定が見つかりませんでした。');
  }

  const service = new TreePathUpdatedAtService(env.TREE_METADATA_DB);
  await service.upsert(req);

  return null;
};

type ErrorStatus = 400 | 401 | 403 | 404 | 422 | 500;

const toErrorStatus = (status: number | undefined): ErrorStatus => {
  if (status === 400) return 400;
  if (status === 401) return 401;
  if (status === 403) return 403;
  if (status === 404) return 404;
  if (status === 422) return 422;
  return 500;
};
