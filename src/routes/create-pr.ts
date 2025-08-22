import type { RouteConfigToTypedResponse } from '@hono/zod-openapi';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Octokit } from 'octokit';
import { toUserFacingError } from '@/errors/userFacingError';
import { formatErrorMessage } from '@/helpers/httpErrorMessageHelper';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import { createPullRequest, type GitHubContext } from '@/services/githubService';
import type { AppEnv } from '@/types/env';
import type { PullRequestPayload } from '@/types/types';

/**
 * zod schemas
 */
/** RepoFileUpsert */
const RepoFileUpsertSchema = z.object({
  path: z.string(),
  content: z.string(),
  operation: z.literal('upsert').optional(),
});

/** RepoFileDelete */
const RepoFileDeleteSchema = z.object({
  path: z.string(),
  operation: z.literal('delete'),
});

/** RepoFile (Upsert | Delete) */
const RepoFileSchema = z.union([RepoFileUpsertSchema, RepoFileDeleteSchema]);

const ApiResponseBase = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    data: z.optional(z.nullable(data)),
    message: z.string().optional(),
  });

// POST body（必要な項目は後で拡張）
const CreatePrRequestSchema = z.object({
  prTitle: z.string(),
  prBody: z.string().optional(),
  branchName: z.string(),
  commitMessage: z.string().optional(),
  files: z.array(RepoFileSchema),
});

type CreatePrRequest = z.infer<typeof CreatePrRequestSchema>;

const SuccessResponseSchema = ApiResponseBase(
  z.array(
    z.object({
      prNumber: z.number().int(),
      prUrl: z.string(),
      branchName: z.string(),
      commitSha: z.string(),
      note: z.string().optional(),
    }),
  ),
);
const ErrorResponseSchema = ApiResponseBase(z.null());

/**
 * OpenAPI route
 */
const route = createRoute({
  method: 'post',
  path: '/create-pr',
  tags: ['create-pr'],
  summary: 'GitHub に Pull Request を作成する',
  description:
    '指定のブランチにファイル変更をコミットし、Pull Request を作成します。\n' +
    '\n' +
    'リクエスト:\n' +
    '- prTitle: PR のタイトル（必須）\n' +
    '- prBody: PR の本文（任意）\n' +
    '- branchName: 作成または更新するブランチ名（必須）\n' +
    '- commitMessage: コミットメッセージ（任意、未指定時はデフォルト）\n' +
    '- files: 変更対象の配列。{ path, content, operation }。operation は upsert|delete。\n' +
    '\n' +
    '検証/安全性:\n' +
    '- path は ensureUserPathSafe によってパス走査などを防止します。\n' +
    '\n' +
    '応答:\n' +
    '- 成功時は prNumber, prUrl, branchName, commitSha, note を含む配列を返します。\n' +
    '\n' +
    'エラー:\n' +
    '- 400: リクエスト不正\n' +
    '- 403: 権限不足\n' +
    '- 422: 処理不能（内容不整合など）\n' +
    '- 500: サーバエラー',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePrRequestSchema,
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

type CreatePrRouteResponse = RouteConfigToTypedResponse<typeof route>;

const r = new OpenAPIHono<AppEnv>();

r.openapi(route, async (c): Promise<CreatePrRouteResponse> => {
  try {
    // バリデート済みのPOSTボディ
    const req = c.req.valid('json') as z.infer<typeof CreatePrRequestSchema>;
    const data: z.infer<typeof SuccessResponseSchema>['data'] = await createPr(c.env, req);

    const body: z.infer<typeof SuccessResponseSchema> = {
      success: true,
      data: data,
    };
    return c.json<typeof body, 200>(body, 200);
  } catch (err) {
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

export default r;

const createPr = async (
  env: AppEnv['Bindings'],
  req: PullRequestPayload,
): Promise<z.infer<typeof SuccessResponseSchema>['data']> => {
  // env 必須値
  const token = env.TARGET_GH_SECRET;
  const owner = env.TARGET_GH_OWNER;
  const repo = env.TARGET_GH_REPO;
  assertEnv('TARGET_GH_SECRET', token);
  assertEnv('TARGET_GH_OWNER', owner);
  assertEnv('TARGET_GH_REPO', repo);
  const defaultBranch = (env.TARGET_GH_DEFAULT_BRANCH || 'master').trim();

  // Octokit とコンテキスト
  const octokit = new Octokit({ auth: token });
  const ctx: GitHubContext = { octokit, owner, repo, defaultBranch };

  // CreatePrRequest → PullRequestPayload 変換（同名フィールドを直接使用）
  const { prTitle, prBody, commitMessage, branchName, files } = req as CreatePrRequest;
  const payload: PullRequestPayload = {
    prTitle: prTitle,
    prBody: prBody,
    commitMessage,
    branchName,
    files,
  };
  for (const file of files) ensureUserPathSafe(file.path);

  const result = await createPullRequest(payload, ctx);

  // 失敗時はエラーとして投げて上位の 500 ハンドリングへ
  if ('error' in result) {
    const detail = result.detail ? `: ${result.detail}` : '';
    throw new Error(`${result.error}${detail}`);
  }

  // 成功を配列に包んで返す（APIレスポンス定義に合わせる）
  return [
    {
      prNumber: result.prNumber,
      prUrl: result.prUrl,
      branchName: result.branchName,
      commitSha: result.commitSha,
      ...(result.note ? { note: result.note } : {}),
    },
  ];
};

/* internal */
function assertEnv(name: string, v: string | undefined): asserts v is string {
  if (!v || !v.trim()) {
    throw new Error(`missing required env: ${name}`);
  }
}

type ErrorStatus = 400 | 403 | 422 | 500;

const toErrorStatus = (status: number | undefined): ErrorStatus => {
  if (status === 400) return 400;
  if (status === 403) return 403;
  if (status === 422) return 422;
  return 500;
};
