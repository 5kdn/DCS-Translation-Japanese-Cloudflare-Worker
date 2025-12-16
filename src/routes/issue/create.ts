import { createRoute, type OpenAPIHono, type RouteConfigToTypedResponse, z } from '@hono/zod-openapi';
import { App as GitHubApp } from 'octokit';
import { toUserFacingError } from '@/errors/userFacingError';
import { getRequiredEnvNumber, getRequiredEnvString } from '@/helpers/environmentHelper';
import { formatErrorMessage } from '@/helpers/httpErrorMessageHelper';
import { createIssue, type GitHubContext } from '@/services/githubService';
import type { AppEnv } from '@/types/env';
import type { IssuePayload } from '@/types/types';

/**
 * zod schemas
 */
const ApiResponseBase = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data: z.optional(z.nullable(data)),
    message: z.string().optional(),
  });

const RequestSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
});

/** 成功時のレスポンススキーマ。 */
const SuccessResponseSchema = ApiResponseBase(
  z.array(
    z.object({
      issueNumber: z.number().int(),
      issueUrl: z.string(),
    }),
  ),
);

/** 失敗時のレスポンススキーマ。 */
const ErrorResponseSchema = ApiResponseBase(z.null());

type CreateIssueRequest = z.infer<typeof RequestSchema>;
type CreateIssueRouteResponse = RouteConfigToTypedResponse<typeof route>;

/**
 * OpenAPI route
 */
const route = createRoute({
  method: 'post',
  path: '/create',
  tags: ['issue'],
  summary: 'GitHub に Issue を作成する',
  description:
    '指定のリポジトリに Issue を作成します。\n' +
    '\n' +
    'リクエスト:\n' +
    '- title: Issue のタイトル（必須）\n' +
    '- body: Issue の本文（任意）\n' +
    '- labels: 適用するラベル配列（任意）\n' +
    '- assignees: アサインするユーザー配列（任意）\n' +
    '\n' +
    '応答:\n' +
    '- 成功時は issueNumber と issueUrl を含む配列を返します。\n' +
    '\n' +
    'エラー:\n' +
    '- 400: リクエスト不正\n' +
    '- 403: 権限不足\n' +
    '- 404: リポジトリが見つからない\n' +
    '- 422: 処理不能（内容不整合など）\n' +
    '- 500: サーバーエラー',
  request: {
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

export const registerIssueCreateRoutes = (app: OpenAPIHono<AppEnv>) => {
  app.openapi(route, async (c): Promise<CreateIssueRouteResponse> => {
    try {
      const request = c.req.valid('json') as z.infer<typeof RequestSchema>;

      const data: z.infer<typeof SuccessResponseSchema>['data'] = await createIssueHandler(c.env, request);

      const body: z.infer<typeof SuccessResponseSchema> = {
        success: true,
        data,
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
 * @summary GitHub の 対象のリポジトリに Issue を作成する。
 */
const createIssueHandler = async (
  env: AppEnv['Bindings'],
  req: IssuePayload,
): Promise<z.infer<typeof SuccessResponseSchema>['data']> => {
  const {
    TARGET_GH_APP_ID,
    TARGET_GH_APP_PRIVATE_KEY,
    TARGET_GH_INSTALLATION_ID,
    TARGET_GH_OWNER,
    TARGET_GH_REPO,
    TARGET_GH_DEFAULT_BRANCH,
  } = env as Record<string, string | undefined>;
  const appId = getRequiredEnvNumber('TARGET_GH_APP_ID', TARGET_GH_APP_ID);
  const privateKey = getRequiredEnvString('TARGET_GH_APP_PRIVATE_KEY', TARGET_GH_APP_PRIVATE_KEY);
  const installationId = getRequiredEnvNumber('TARGET_GH_INSTALLATION_ID', TARGET_GH_INSTALLATION_ID);
  const owner = getRequiredEnvString('TARGET_GH_OWNER', TARGET_GH_OWNER);
  const repo = getRequiredEnvString('TARGET_GH_REPO', TARGET_GH_REPO);
  const defaultBranch = (TARGET_GH_DEFAULT_BRANCH || 'master').trim();

  const app = new GitHubApp({ appId, privateKey });
  const octokit = await app.getInstallationOctokit(installationId);

  const { title, body, labels, assignees } = req as CreateIssueRequest;
  const ctx: GitHubContext = {
    octokit,
    owner,
    repo,
    defaultBranch,
  };
  const payload: IssuePayload = {
    title,
    body,
    labels,
    assignees,
  };
  const result = await createIssue(payload, ctx);
  if ('error' in result) {
    const detail = result.detail ? `: ${result.detail}` : '';
    throw new Error(`${result.error}${detail}`);
  }

  return [
    {
      issueNumber: result.issueNumber,
      issueUrl: result.issueUrl,
    },
  ];
};

type ErrorStatus = 400 | 403 | 404 | 422 | 500;

const toErrorStatus = (status: number | undefined): ErrorStatus => {
  if (status === 400) return 400;
  if (status === 403) return 403;
  if (status === 404) return 404;
  if (status === 422) return 422;
  return 500;
};
