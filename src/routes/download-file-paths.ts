import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { DEFAULT_DOWNLOAD_LIMITS } from '@/config/downloadLimits';
import { isFilePathAllowed } from '@/config/filePermissionFilters';
import { UserFacingError } from '@/errors/userFacingError';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import { createProblemDetails, respondProblemDetails } from '@/helpers/problemDetailsHelper';
import { TokenBucketRateLimiter } from '@/services/rateLimiterService';
import type { AppEnv } from '@/types/env';

type GitHubContext = { owner: string; repo: string; defaultBranch: string };

const DownloadFilesRequestSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(DEFAULT_DOWNLOAD_LIMITS.maxFilePathCount),
});

const ProblemErrorsSchema = z.record(z.string(), z.array(z.string())).openapi({
  type: 'object',
  additionalProperties: {
    type: 'array',
    items: { type: 'string' },
  },
});

const ProblemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  errors: ProblemErrorsSchema.optional(),
});

const FileEntrySchema = z.object({
  path: z.string(),
  url: z.string().url(),
});

const SuccessResponseSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  etag: z.string(),
  files: z.array(FileEntrySchema),
});

const route = createRoute({
  method: 'post',
  path: '/download-file-paths',
  tags: ['download-file-paths'],
  summary: '指定パスのGitHub RAW URL一覧を返却する',
  description:
    '指定したリポジトリから複数ファイルの RAW URL を生成し、JSON で返却するエンドポイントです。\n' +
    '用途: UI からの一括ダウンロードや外部連携。\n' +
    '\n' +
    'リクエスト:\n' +
    '- JSON Body { paths: string[] } を必須とし、空文字・重複・不正パスを検証します。\n' +
    '\n' +
    '制限:\n' +
    `- 件数上限: ${DEFAULT_DOWNLOAD_LIMITS.maxFilePathCount}。\n` +
    `- 単一ファイル上限: ${DEFAULT_DOWNLOAD_LIMITS.maxSingleBytes} bytes。合計上限: ${DEFAULT_DOWNLOAD_LIMITS.maxTotalBytes} bytes。\n` +
    '\n' +
    'レート制限:\n' +
    '- Token Bucket を使用します。X-RateLimit-* ヘッダを返却し、超過時は 429 を返します。\n' +
    '\n' +
    'キャッシュ:\n' +
    '- If-None-Match を評価し、ETag が一致する場合は 304 を返します。\n' +
    '\n' +
    'エラー応答:\n' +
    '- application/problem+json を返します。type は validation / unprocessable / rate-limit / internal を使用します。\n',

  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: DownloadFilesRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'パス一覧を返却する',
      content: {
        'application/json': {
          schema: SuccessResponseSchema,
        },
      },
    },
    304: {
      description: '変更なし',
    },
    400: {
      description: '入力検証エラー',
      content: {
        'application/problem+json': {
          schema: ProblemDetailsSchema,
        },
      },
    },
    422: {
      description: '取得対象エラー',
      content: {
        'application/problem+json': {
          schema: ProblemDetailsSchema,
        },
      },
    },
    429: {
      description: 'レート制限超過',
      content: {
        'application/problem+json': {
          schema: ProblemDetailsSchema,
        },
      },
    },
    500: {
      description: 'サーバエラー',
      content: {
        'application/problem+json': {
          schema: ProblemDetailsSchema,
        },
      },
    },
  },
});

const r = new OpenAPIHono<AppEnv>();

r.openapi(route, async (c) => {
  const bindings = c.env;
  const limit = parseRateLimit(bindings.DOWNLOAD_FILES_RATE_LIMIT);
  const limiter = getRateLimiter(limit);
  const rateKey = c.req.header('cf-connecting-ip') ?? 'anonymous';
  const rate = limiter.consume(rateKey);

  if (!rate.allowed) {
    c.header('Retry-After', String(Math.max(0, Math.ceil((rate.resetAt - Date.now()) / 1000))));
    return respondProblemDetails(
      c,
      createProblemDetails({
        type: PROBLEM_TYPE_RATE_LIMIT,
        title: 'Too Many Requests',
        status: 429,
        detail: '一定時間内のリクエスト上限を超過しました。',
        instance: c.req.path,
      }),
    );
  }

  const parsed = c.req.valid('json') as z.infer<typeof DownloadFilesRequestSchema>;
  const normalization = normalizePaths(parsed.paths);
  if (!normalization.ok) {
    return respondProblemDetails(
      c,
      createProblemDetails({
        type: PROBLEM_TYPE_VALIDATION,
        title: 'Bad Request',
        status: 400,
        detail: '入力の検証に失敗しました。',
        instance: c.req.path,
        errors: normalization.errors,
      }),
    );
  }

  let ctx: GitHubContext;
  try {
    ctx = createGitHubContext(bindings);
  } catch {
    return respondProblemDetails(
      c,
      createProblemDetails({
        type: PROBLEM_TYPE_INTERNAL,
        title: 'Internal Error',
        status: 500,
        detail: '内部エラーが発生しました。',
        instance: c.req.path,
      }),
    );
  }

  const filesResult = buildFileUrls(ctx, normalization.paths);

  if (!filesResult.ok) {
    return respondProblemDetails(
      c,
      createProblemDetails({
        type: PROBLEM_TYPE_UNPROCESSABLE,
        title: 'Unprocessable Entity',
        status: 422,
        detail: '指定したパスのURLを生成できませんでした。',
        instance: c.req.path,
        errors: filesResult.errors,
      }),
    );
  }

  const now = new Date();
  const etag = await calculateEtag(filesResult.files);
  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch && parseIfNoneMatch(ifNoneMatch).has(etag)) {
    const headers = new Headers({
      ETag: etag,
      'X-File-Count': String(filesResult.files.length),
    });
    applyRateLimitHeaders(headers, rate);
    return new Response(null, { status: 304, headers });
  }

  const headers = new Headers({
    'Content-Type': 'application/json',
    ETag: etag,
    'X-File-Count': String(filesResult.files.length),
  });
  applyRateLimitHeaders(headers, rate);

  const body: z.infer<typeof SuccessResponseSchema> = {
    version: 1,
    generatedAt: now.toISOString(),
    etag,
    files: filesResult.files.map((file) => ({
      path: file.path,
      url: file.url,
    })),
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers,
  });
});

export default r;

type ProblemErrorBag = Record<string, string[]>;

type NormalizationResult = { ok: true; paths: Array<{ path: string; index: number }> } | { ok: false; errors: ProblemErrorBag };

const normalizePaths = (paths: string[]): NormalizationResult => {
  const errors: ProblemErrorBag = {};
  const normalized: Array<{ path: string; index: number }> = [];
  const seen = new Map<string, number>();

  paths.forEach((raw, index) => {
    const key = `paths[${index}]`;
    const trimmed = raw.trim();
    if (!trimmed) {
      pushError(errors, key, '値を空にできません。');
      return;
    }
    if (/^(\/|\\)/.test(trimmed)) {
      pushError(errors, key, '先頭にスラッシュを付与できません。');
      return;
    }
    let normalizedPath = trimmed;
    while (normalizedPath.startsWith('./') || normalizedPath.startsWith('.\\\\')) {
      normalizedPath = normalizedPath.slice(2);
    }
    normalizedPath = normalizedPath.replace(/\\/g, '/');
    if (!normalizedPath) {
      pushError(errors, key, 'パスを正しく指定してください。');
      return;
    }
    try {
      ensureUserPathSafe(normalizedPath);
    } catch (err) {
      pushError(errors, key, err instanceof UserFacingError ? err.userMessage : '不正なパスを検出しました。');
      return;
    }
    if (!isFilePathAllowed(normalizedPath)) {
      pushError(errors, key, '指定したパスは取得を許可していません。');
      return;
    }
    if (seen.has(normalizedPath)) {
      const duplicatedIndex = seen.get(normalizedPath) ?? index;
      pushError(errors, key, `同一パスを重複指定できません。（${duplicatedIndex}番目と重複）`);
      return;
    }
    seen.set(normalizedPath, index);
    normalized.push({ path: normalizedPath, index });
  });

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, paths: normalized };
};

const buildFileUrls = (
  ctx: GitHubContext,
  records: Array<{ path: string; index: number }>,
):
  | {
      ok: true;
      files: Array<{ path: string; url: string }>;
    }
  | { ok: false; errors: ProblemErrorBag } => {
  const errors: ProblemErrorBag = {};
  const files: Array<{ path: string; url: string }> = [];

  for (const record of records) {
    if (!isFilePathAllowed(record.path)) {
      pushError(errors, `paths[${record.index}]`, '指定したパスは取得を許可していません。');
      continue;
    }
    const url = buildRawFileUrl(ctx, record.path);
    files.push({ path: record.path, url });
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, files };
};

const calculateEtag = async (files: Array<{ path: string; url: string }>): Promise<string> => {
  const encoder = new TextEncoder();
  const payload = JSON.stringify(files.map((f) => ({ path: f.path, url: f.url })).sort((a, b) => a.path.localeCompare(b.path)));
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
  return `"${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')}"`;
};

const parseIfNoneMatch = (value: string): Set<string> => {
  return new Set(
    value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean),
  );
};

const getRateLimiter = (limit: number): TokenBucketRateLimiter => {
  const normalized = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : DEFAULT_RATE_LIMIT;
  const existing = rateLimiterCache.get(normalized);
  if (existing) return existing;
  const limiter = new TokenBucketRateLimiter(normalized, RATE_LIMIT_WINDOW_MS);
  rateLimiterCache.set(normalized, limiter);
  return limiter;
};

const parseRateLimit = (raw: string | undefined): number => {
  if (!raw) return DEFAULT_RATE_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RATE_LIMIT;
  return parsed;
};

const applyRateLimitHeaders = (headers: Headers, rate: { limit: number; remaining: number; resetAt: number }): void => {
  headers.set('X-RateLimit-Limit', String(rate.limit));
  headers.set('X-RateLimit-Remaining', String(Math.max(0, rate.remaining)));
  headers.set('X-RateLimit-Reset', String(Math.floor(rate.resetAt / 1000)));
};

const createGitHubContext = (env: AppEnv['Bindings']): GitHubContext => {
  const owner = env.TARGET_GH_OWNER;
  const repo = env.TARGET_GH_REPO;
  assertEnv('TARGET_GH_OWNER', owner);
  assertEnv('TARGET_GH_REPO', repo);
  const defaultBranch = (env.TARGET_GH_DEFAULT_BRANCH || 'master').trim();
  return { owner, repo, defaultBranch };
};

const buildRawFileUrl = (ctx: GitHubContext, path: string): string => {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${encodeURIComponent(ctx.owner)}/${encodeURIComponent(ctx.repo)}/${encodeURIComponent(ctx.defaultBranch)}/${encodedPath}`;
};

const assertEnv = (name: string, value: string | undefined): void => {
  if (!value?.trim()) {
    throw new Error(`missing required env: ${name}`);
  }
};

const pushError = (bag: ProblemErrorBag, key: string, message: string): void => {
  const list = bag[key] ?? [];
  list.push(message);
  bag[key] = list;
};
const DEFAULT_RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const PROBLEM_TYPE_VALIDATION = 'https://dcs-translation-japanese.workers.dev/problem/validation';
const PROBLEM_TYPE_UNPROCESSABLE = 'https://dcs-translation-japanese.workers.dev/problem/unprocessable';
const PROBLEM_TYPE_RATE_LIMIT = 'https://dcs-translation-japanese.workers.dev/problem/rate-limit';
const PROBLEM_TYPE_INTERNAL = 'https://dcs-translation-japanese.workers.dev/problem/internal';
const rateLimiterCache = new Map<number, TokenBucketRateLimiter>();
