import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Octokit } from 'octokit';
import { DEFAULT_DOWNLOAD_LIMITS } from '@/config/downloadLimits';
import { RepositoryPathNotFoundError } from '@/errors/repositoryPathNotFoundError';
import { UserFacingError } from '@/errors/userFacingError';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import { createProblemDetails, respondProblemDetails } from '@/helpers/problemDetailsHelper';
import { fetchRepositoryFile, type GitHubContext } from '@/services/githubService';
import { TokenBucketRateLimiter } from '@/services/rateLimiterService';
import { buildZip64Stream } from '@/services/zipStreamService';
import type { AppEnv } from '@/types/env';

const DEFAULT_RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const GITHUB_FETCH_PAGE_SIZE = 100;
const rateLimiterCache = new Map<number, TokenBucketRateLimiter>();
const PROBLEM_TYPE_VALIDATION = 'https://dcs-translation-japanese.workers.dev/problem/validation';
const PROBLEM_TYPE_UNPROCESSABLE = 'https://dcs-translation-japanese.workers.dev/problem/unprocessable';
const PROBLEM_TYPE_RATE_LIMIT = 'https://dcs-translation-japanese.workers.dev/problem/rate-limit';
const PROBLEM_TYPE_INTERNAL = 'https://dcs-translation-japanese.workers.dev/problem/internal';

const DownloadFilesRequestSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(DEFAULT_DOWNLOAD_LIMITS.maxFileCount),
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

const route = createRoute({
  method: 'post',
  path: '/download-files',
  tags: ['download-files'],
  summary: '指定パスの複数ファイルをZIPで返却する',
  description:
    '指定したリポジトリから複数のファイルを取得し、ZIP ストリームで返却するエンドポイントです。\n' +
    '用途: UI からの一括ダウンロードや外部連携。\n' +
    '\n' +
    'リクエスト:\n' +
    '- JSON Body { paths: string[] } を必須とし、空文字・重複・不正パスを検証します。\n' +
    '\n' +
    '制限:\n' +
    `- 件数上限: ${DEFAULT_DOWNLOAD_LIMITS.maxFileCount}。\n` +
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
      description: 'ZIPファイルを返却する',
      content: {
        'application/zip': {
          schema: z.any().openapi({
            type: 'string',
            format: 'binary',
            description: 'ZIPストリームを返却する',
          }),
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
  c.header('X-RateLimit-Limit', String(rate.limit));
  c.header('X-RateLimit-Remaining', String(Math.max(0, rate.remaining)));
  c.header('X-RateLimit-Reset', String(Math.floor(rate.resetAt / 1000)));

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

  const fetchResult = await fetchFiles(ctx, normalization.paths);
  if (!fetchResult.ok) {
    return respondProblemDetails(
      c,
      createProblemDetails({
        type: PROBLEM_TYPE_UNPROCESSABLE,
        title: 'Unprocessable Entity',
        status: 422,
        detail: '指定したファイルを取得できませんでした。',
        instance: c.req.path,
        errors: fetchResult.errors,
      }),
    );
  }

  const now = new Date();
  const manifest = await buildManifest(fetchResult.files, now);
  const entries = [
    ...fetchResult.files.map((file) => ({
      name: file.path,
      content: file.content,
      lastModified: now,
    })),
    {
      name: 'manifest.json',
      content: manifest.content,
      lastModified: now,
    },
  ];

  const etag = await calculateEtag(fetchResult.files);
  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch && parseIfNoneMatch(ifNoneMatch).has(etag)) {
    const headers = new Headers({
      ETag: etag,
      'Content-Disposition': buildContentDisposition(now),
    });
    headers.set('X-File-Count', String(fetchResult.files.length));
    headers.set('X-Total-Bytes', String(fetchResult.totalBytes));
    applyRateLimitHeaders(headers, rate);
    return new Response(null, { status: 304, headers });
  }

  const zip = buildZip64Stream(entries);

  const headers = new Headers({
    'Content-Type': 'application/zip',
    'Content-Disposition': buildContentDisposition(now),
    ETag: etag,
    'X-File-Count': String(fetchResult.files.length),
  });

  if (fetchResult.totalBytes !== undefined) {
    headers.set('X-Total-Bytes', String(fetchResult.totalBytes));
  }
  applyRateLimitHeaders(headers, rate);

  return new Response(zip.stream, {
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
    while (normalizedPath.startsWith('./') || normalizedPath.startsWith('.\\')) {
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

const fetchFiles = async (
  ctx: GitHubContext,
  records: Array<{ path: string; index: number }>,
): Promise<
  | {
      ok: true;
      files: Array<{ path: string; content: Uint8Array; size: number; sha: string; sha256: string }>;
      totalBytes: number;
    }
  | { ok: false; errors: ProblemErrorBag }
> => {
  const errors: ProblemErrorBag = {};
  const files: Array<{ path: string; content: Uint8Array; size: number; sha: string; sha256: string }> = [];
  let total = 0;

  for (const page of paginate(records, GITHUB_FETCH_PAGE_SIZE)) {
    for (const record of page) {
      try {
        const file = await fetchRepositoryFile(ctx, record.path);
        if (file.size > DEFAULT_DOWNLOAD_LIMITS.maxSingleBytes) {
          pushError(
            errors,
            `paths[${record.index}]`,
            `ファイルサイズが上限(${DEFAULT_DOWNLOAD_LIMITS.maxSingleBytes}バイト)を超過しています。`,
          );
          continue;
        }
        const nextTotal = total + file.size;
        if (nextTotal > DEFAULT_DOWNLOAD_LIMITS.maxTotalBytes) {
          pushError(errors, `paths[${record.index}]`, '合計サイズが上限を超過しました。');
          continue;
        }
        total = nextTotal;
        const sha256 = await digestSha256Hex(file.content);
        files.push({ path: file.path, content: file.content, size: file.size, sha: file.sha, sha256 });
      } catch (err) {
        if (err instanceof RepositoryPathNotFoundError) {
          pushError(errors, `paths[${record.index}]`, '指定したパスのファイルが見つかりません。');
          continue;
        }
        if (err instanceof UserFacingError) {
          pushError(errors, `paths[${record.index}]`, err.userMessage);
          continue;
        }
        console.error('failed to fetch repository file', err);
        pushError(errors, `paths[${record.index}]`, 'ファイル取得中に内部エラーが発生しました。');
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, files, totalBytes: total };
};

/**
 * 配列を指定件数ごとにページ分割する。
 */
const paginate = <T>(input: readonly T[], pageSize: number): T[][] => {
  const pages: T[][] = [];
  for (let i = 0; i < input.length; i += pageSize) {
    pages.push(input.slice(i, i + pageSize));
  }
  return pages;
};

const buildManifest = async (
  files: Array<{ path: string; size: number; sha256: string }>,
  issuedAt: Date,
): Promise<{ content: Uint8Array; sha256: string }> => {
  const payload = {
    version: 1,
    generatedAt: issuedAt.toISOString(),
    files: files.map((file) => ({
      path: file.path,
      size: file.size,
      sha256: file.sha256,
    })),
  };
  const encoder = new TextEncoder();
  const content = encoder.encode(JSON.stringify(payload, null, 2));
  const sha256 = await digestSha256Hex(content);
  return { content, sha256 };
};

const calculateEtag = async (files: Array<{ path: string; sha256: string }>): Promise<string> => {
  const encoder = new TextEncoder();
  const payload = JSON.stringify(
    files.map((f) => ({ path: f.path, sha256: f.sha256 })).sort((a, b) => a.path.localeCompare(b.path)),
  );
  const digest = await digestSha256Hex(encoder.encode(payload));
  return `"${digest}"`;
};

const normalizeBufferSource = (input: Uint8Array<ArrayBufferLike> | ArrayBuffer): ArrayBuffer => {
  if (input instanceof ArrayBuffer) {
    return input;
  }
  const { buffer, byteOffset, byteLength } = input;
  if (buffer instanceof ArrayBuffer) {
    if (byteOffset === 0 && byteLength === buffer.byteLength) {
      return buffer;
    }
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  const copy = new Uint8Array(byteLength);
  copy.set(input);
  return copy.buffer;
};

const digestSha256Hex = async (input: Uint8Array<ArrayBufferLike> | ArrayBuffer): Promise<string> => {
  const buffer = normalizeBufferSource(input);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const parseIfNoneMatch = (value: string): Set<string> => {
  return new Set(
    value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean),
  );
};

const buildContentDisposition = (issuedAt: Date): string => {
  const iso = issuedAt.toISOString().replace(/[:]/g, '-');
  return `attachment; filename="files-${iso}.zip"`;
};

function getRateLimiter(limit: number): TokenBucketRateLimiter {
  const normalized = Number.isFinite(limit) && limit > 0 ? Math.trunc(limit) : DEFAULT_RATE_LIMIT;
  const existing = rateLimiterCache.get(normalized);
  if (existing) return existing;
  const limiter = new TokenBucketRateLimiter(normalized, RATE_LIMIT_WINDOW_MS);
  rateLimiterCache.set(normalized, limiter);
  return limiter;
}

function parseRateLimit(raw: string | undefined): number {
  if (!raw) return DEFAULT_RATE_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RATE_LIMIT;
  return parsed;
}

const applyRateLimitHeaders = (headers: Headers, rate: { limit: number; remaining: number; resetAt: number }): void => {
  headers.set('X-RateLimit-Limit', String(rate.limit));
  headers.set('X-RateLimit-Remaining', String(Math.max(0, rate.remaining)));
  headers.set('X-RateLimit-Reset', String(Math.floor(rate.resetAt / 1000)));
};

const createGitHubContext = (env: AppEnv['Bindings']): GitHubContext => {
  const token = env.TARGET_GH_SECRET;
  const owner = env.TARGET_GH_OWNER;
  const repo = env.TARGET_GH_REPO;
  assertEnv('TARGET_GH_SECRET', token);
  assertEnv('TARGET_GH_OWNER', owner);
  assertEnv('TARGET_GH_REPO', repo);
  const defaultBranch = (env.TARGET_GH_DEFAULT_BRANCH || 'master').trim();
  const octokit = new Octokit({ auth: token });
  return { octokit, owner, repo, defaultBranch };
};

const assertEnv = (name: string, value: string | undefined): void => {
  if (!value || !value.trim()) {
    throw new Error(`missing required env: ${name}`);
  }
};

const pushError = (bag: ProblemErrorBag, key: string, message: string): void => {
  const list = bag[key] ?? [];
  list.push(message);
  bag[key] = list;
};
