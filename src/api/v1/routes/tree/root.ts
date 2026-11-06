import { createRoute, type OpenAPIHono, type RouteConfigToTypedResponse, z } from '@hono/zod-openapi';
import { App as GitHubApp } from 'octokit';
import { toUserFacingError } from '@/errors/userFacingError';
import { getRequiredEnvD1Database, getRequiredEnvNumber, getRequiredEnvString } from '@/helpers/environmentHelper';
import { formatErrorMessage } from '@/helpers/httpErrorMessageHelper';
import { type GitHubContext, getFilteredTreeItems } from '@/services/githubService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv } from '@/types/env';

/**
 * zod schemas
 */
const RequestSchema = z.object({});

/** 成功時のレスポンススキーマ。 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.literal('blob'),
      sha: z.string(),
      size: z.number().int().nonnegative().optional(),
      url: z.string().optional(),
      updatedAt: z.iso.datetime().nullable(),
    }),
  ),
  message: z.string().optional(),
});

/** 失敗時のレスポンススキーマ。 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  message: z.string().optional(),
});

type TreeRouteResponse = RouteConfigToTypedResponse<typeof route>;

/**
 * OpenAPI route
 */
const route = createRoute({
  method: 'get',
  path: '/',
  tags: ['tree'],
  summary: 'GitHub リポジトリのツリー構造を取得する',
  description:
    '指定された GitHub リポジトリのデフォルトブランチから、DCSWorld, UserMissions 配下のファイル一覧（TreeItem配列）を取得して返す。\n',
  request: {
    query: RequestSchema,
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

export const registerTreeRootRoutes = (app: OpenAPIHono<AppEnv>) => {
  app.openapi(route, async (c): Promise<TreeRouteResponse> => {
    try {
      // requestのバリデート

      // data の取得
      const data: z.infer<typeof SuccessResponseSchema>['data'] = await getTree(c.env);

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
 * @summary GitHub の Tree を取得し、最終更新日時を追加して返却する。
 */
const getTree = async (env: AppEnv['Bindings']): Promise<z.infer<typeof SuccessResponseSchema>['data']> => {
  const {
    TARGET_GH_APP_ID,
    TARGET_GH_APP_PRIVATE_KEY,
    TARGET_GH_INSTALLATION_ID,
    TARGET_GH_OWNER,
    TARGET_GH_REPO,
    TARGET_GH_DEFAULT_BRANCH,
    TREE_METADATA_DB,
  } = env;
  const appId = getRequiredEnvNumber('TARGET_GH_APP_ID', TARGET_GH_APP_ID);
  const privateKey = getRequiredEnvString('TARGET_GH_APP_PRIVATE_KEY', TARGET_GH_APP_PRIVATE_KEY);
  const installationId = getRequiredEnvNumber('TARGET_GH_INSTALLATION_ID', TARGET_GH_INSTALLATION_ID);
  const owner = getRequiredEnvString('TARGET_GH_OWNER', TARGET_GH_OWNER);
  const repo = getRequiredEnvString('TARGET_GH_REPO', TARGET_GH_REPO);
  const defaultBranch = (TARGET_GH_DEFAULT_BRANCH || 'master').trim();
  const db = getRequiredEnvD1Database('TREE_METADATA_DB', TREE_METADATA_DB);

  const app = new GitHubApp({ appId, privateKey });
  const octokit = await app.getInstallationOctokit(installationId);

  const ctx: GitHubContext = { octokit, owner, repo, defaultBranch };
  const items = await getFilteredTreeItems(ctx);

  // items にupdatedAt を追加する
  const treePathUpdatedAtItem = new TreePathUpdatedAtService(db);
  const updates = await treePathUpdatedAtItem.read();
  items.forEach((item) => {
    const date = updates[item.path];
    item.updatedAt = date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
  });
  return items;
};

type ErrorStatus = 400 | 403 | 422 | 500;

const toErrorStatus = (status: number | undefined): ErrorStatus => {
  if (status === 400) return 400;
  if (status === 403) return 403;
  if (status === 422) return 422;
  return 500;
};
