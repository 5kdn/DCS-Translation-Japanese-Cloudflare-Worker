import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Octokit } from 'octokit';
import { toUserFacingError } from '@/errors/userFacingError';
import { formatErrorMessage } from '@/helpers/httpErrorMessageHelper';
import { getFilteredTreeItems } from '@/services/githubService';
import type { AppEnv } from '@/types/env';
import type { TreeItem } from '@/types/types';

/** zod schemas */
const TreeItemSchema = z.object({
  path: z.string(),
  mode: z.string(),
  type: z.literal('blob'),
  sha: z.string(),
  size: z.number().int().nonnegative().optional(),
  url: z.string().optional(),
});

/** 正常レスポンスのスキーマを表現する */
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(TreeItemSchema),
  message: z.string().optional(),
});

/** エラーレスポンスのスキーマを表現する */
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

const ERROR_STATUS_CODES = [400, 403, 422, 500] as const;
type ErrorStatusCode = (typeof ERROR_STATUS_CODES)[number];

const isErrorStatusCode = (status: number): status is ErrorStatusCode => ERROR_STATUS_CODES.includes(status as ErrorStatusCode);

/**
 * OpenAPI route
 */
const route = createRoute({
  method: 'get',
  path: '/tree',
  tags: ['tree'],
  summary: 'GitHub リポジトリのツリー構造を取得',
  description:
    '指定された GitHub リポジトリのデフォルトブランチから、DCSWorld, UserMissions 配下のファイル一覧（TreeItem配列）を取得して返す。',
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

const r = new OpenAPIHono<AppEnv>();

r.openapi(route, async (c) => {
  try {
    const data = await getTree(c.env);

    const body: z.infer<typeof SuccessResponseSchema> = {
      success: true,
      data: data,
    };
    return c.json(body, 200);
  } catch (err) {
    const userError = toUserFacingError(err);
    const errBody: z.infer<typeof ErrorResponseSchema> = {
      success: false,
      message: formatErrorMessage(userError),
    };
    const status = isErrorStatusCode(userError.status) ? userError.status : 500;
    return c.json(errBody, { status });
  }
});

export default r;

/**
 * GitHub から DCSWorld, UserMissions 配下のファイル一覧(TreeItem[])を取得して返す。
 * 期待する環境変数:
 *  - GITHUB_TOKEN            : string
 *  - GITHUB_OWNER            : string
 *  - GITHUB_REPO             : string
 *  - GITHUB_DEFAULT_BRANCH   : string (任意、未設定時は 'main')
 */
const getTree = async (env: AppEnv['Bindings']): Promise<TreeItem[]> => {
  const { TARGET_GH_SECRET, TARGET_GH_OWNER, TARGET_GH_REPO, TARGET_GH_DEFAULT_BRANCH } = env as Record<
    string,
    string | undefined
  >;

  assertEnv('TARGET_GH_SECRET', TARGET_GH_SECRET);
  assertEnv('TARGET_GH_OWNER', TARGET_GH_OWNER);
  assertEnv('TARGET_GH_REPO', TARGET_GH_REPO);

  const octokit = new Octokit({ auth: TARGET_GH_SECRET });
  const owner = TARGET_GH_OWNER;
  const repo = TARGET_GH_REPO;
  const defaultBranch = (TARGET_GH_DEFAULT_BRANCH || 'master').trim();

  const items = await getFilteredTreeItems({
    octokit,
    owner,
    repo,
    defaultBranch,
  });

  return items;
};

/* internal */
function assertEnv(name: string, v: string | undefined): asserts v is string {
  if (!v || !v.trim()) {
    throw new Error(`missing required env: ${name}`);
  }
}
