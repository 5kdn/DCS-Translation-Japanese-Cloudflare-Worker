/**
 * v2専用の入力検証・操作登録・Problem Details応答を提供する。
 * 旧APIのルーティングやエラー処理には適用しない。
 * @packageDocumentation
 */
import { OpenAPIHono, type z } from '@hono/zod-openapi';
import type { Context, MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { consumeV2WriteAttempt } from '@/services/v2WriteRateLimiterService';
import type { AppEnv } from '@/types/env';
import type { problemSchema } from './routes/common';

/** v2の共通エラー本文。 */
type Problem = z.infer<typeof problemSchema>;

/** OASで定義した操作固有のエラーコードを共通応答へ渡す。 */
export class ProblemException extends HTTPException {
  /**
   * @param status Problem DetailsとHTTP応答に設定するステータス。
   * @param code ステータスだけでは区別できない操作固有のエラーコード。
   */
  constructor(
    status: ContentfulStatusCode,
    readonly code: Problem['code'],
  ) {
    super(status);
  }
}

/** HTTPステータスに対応する公開タイトルとOASのエラーコード。 */
const failures: Partial<Record<number, readonly [string, Problem['code']]>> = {
  400: ['Bad Request', 'INVALID_REQUEST'],
  401: ['Unauthorized', 'UNAUTHENTICATED'],
  403: ['Forbidden', 'FORBIDDEN'],
  404: ['Not Found', 'NOT_FOUND'],
  405: ['Method Not Allowed', 'METHOD_NOT_ALLOWED'],
  406: ['Not Acceptable', 'NOT_ACCEPTABLE'],
  409: ['Conflict', 'CONFLICT'],
  413: ['Content Too Large', 'PAYLOAD_TOO_LARGE'],
  414: ['URI Too Long', 'URI_TOO_LONG'],
  415: ['Unsupported Media Type', 'UNSUPPORTED_MEDIA_TYPE'],
  422: ['Unprocessable Content', 'UNPROCESSABLE_CONTENT'],
  429: ['Too Many Requests', 'RATE_LIMITED'],
  500: ['Internal Server Error', 'INTERNAL_ERROR'],
  502: ['Bad Gateway', 'UPSTREAM_ERROR'],
  503: ['Service Unavailable', 'SERVICE_UNAVAILABLE'],
};

/**
 * v2の失敗をRFC 9457のProblem Details形式で返す。
 *
 * @param c エラーが発生したリクエストのコンテキスト。
 * @param status 応答と本文のstatusへ設定するHTTPステータス。
 * @param headers 認証・再試行案内など、維持する応答ヘッダー。
 * @param errorCode 操作固有のエラーコード。省略時はステータスに対応する共通コード。
 * @returns クエリ文字列や内部例外を含まないapplication/problem+json応答。
 */
export const problem = (
  c: Context,
  status: ContentfulStatusCode,
  headers?: HeadersInit,
  errorCode?: Problem['code'],
): Response => {
  const [title, code] = failures[status] ?? ['Internal Server Error', 'INTERNAL_ERROR'];
  const body: Problem = {
    type: 'about:blank',
    title,
    status,
    detail: title,
    instance: c.req.path,
    code: errorCode ?? code,
  };
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/problem+json');
  responseHeaders.delete('Content-Length');
  return c.newResponse(JSON.stringify(body), { status, headers: responseHeaders });
};

/**
 * 依存先の利用不可を示す503例外を、整数秒の再試行案内付きで作る。
 *
 * @param seconds 再試行まで待つ秒数。省略時は60秒。
 * @returns Retry-Afterを保持するHTTP例外。
 */
export const dependencyUnavailable = (seconds = 60): HTTPException =>
  new HTTPException(503, {
    res: new Response(null, { status: 503, headers: { 'Retry-After': String(seconds) } }),
  });

/**
 * v2の共有書き込み回数制限が適用される操作か判定する。
 *
 * @param method リクエストのHTTPメソッド。
 * @param path リクエストのパス（/v2を含み、クエリ文字列を含まない）。
 * @returns Issue作成・Issue編集・PR作成のいずれかに該当する場合はtrue。
 */
const isWriteRateLimitedRequest = (method: string, path: string): boolean =>
  (method === 'POST' && /^\/v2\/(issues|prs)\/?$/.test(path)) || (method === 'PATCH' && /^\/v2\/issues\/[^/]+\/?$/.test(path));

/**
 * v2専用の共通ミドルウェアと例外処理を設定したアプリを作成する。
 * リクエストターゲットは8192バイト、本文は5 MiBを上限とする。
 *
 * @returns 操作の登録先となるHonoアプリ。旧APIとはエラー処理を共有しない。
 */
export const createV2App = (): OpenAPIHono<AppEnv> => {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const invalidCursor = result.target === 'query' && result.error.issues.some((issue) => issue.path[0] === 'cursor');
        return problem(c, 400, undefined, invalidCursor ? 'INVALID_CURSOR' : undefined);
      }
    },
  });
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return problem(c, error.status, error.getResponse().headers, error instanceof ProblemException ? error.code : undefined);
    }
    console.error('v2 request failed', error);
    return problem(c, 500);
  });
  app.use('*', async (c, next) => {
    if (isWriteRateLimitedRequest(c.req.method, c.req.path)) {
      const ip = c.req.header('CF-Connecting-IP');
      const db = c.env.TREE_METADATA_DB;
      // Cloudflareが設定する送信元だけを信頼し、共有状態を使えない場合は書き込まない。
      if (!ip || !db) return problem(c, 503, { 'Retry-After': '60' });
      try {
        const retryAfter = await consumeV2WriteAttempt(db, ip);
        if (retryAfter !== null) return problem(c, 429, { 'Retry-After': String(retryAfter) });
      } catch (error) {
        console.error('v2 write rate limiter unavailable', error);
        return problem(c, 503, { 'Retry-After': '60' });
      }
    }
    const url = new URL(c.req.url);
    if (new TextEncoder().encode(url.pathname + url.search).length > 8192) return problem(c, 414);
    // 単値クエリの重複はHonoによる先頭値への変換前に拒否する。
    if (c.req.method === 'GET' || c.req.method === 'HEAD') {
      for (const key of url.searchParams.keys()) {
        if (key !== 'path' && url.searchParams.getAll(key).length > 1) return problem(c, 400);
      }
    }
    await next();
    // Middleware that returns an auth/rate-limit error must use the same failure format as thrown errors.
    if (c.res.status >= 400 && c.res.headers.get('Content-Type')?.split(';')[0] !== 'application/problem+json') {
      c.res = problem(c, c.res.status as ContentfulStatusCode, c.res.headers);
      c.res.headers.delete('Content-Length');
    }
  });
  app.use('*', bodyLimit({ maxSize: 5 * 1024 * 1024, onError: (c) => problem(c, 413) }));
  app.notFound((c) => problem(c, 404));
  return app;
};

/**
 * Acceptの具体的なメディア範囲を優先し、成功応答の形式が許可されるか判定する。
 *
 * @param header Acceptヘッダー。省略時は許可する。
 * @param mediaType OASで定義した成功応答のメディアタイプ。
 * @returns 適用するメディア範囲のq値が0より大きく1以下ならtrue。
 */
const accepts = (header: string | undefined, mediaType: string): boolean => {
  if (!header) return true;
  const [type] = mediaType.split('/');
  const matches = header.split(',').map((part) => {
    const [range = '', ...parameters] = part.trim().toLowerCase().split(';');
    const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
    return { range: range.trim(), quality: quality ? Number(quality.trim().slice(2)) : 1 };
  });
  for (const range of [mediaType, `${type}/*`, '*/*']) {
    const match = matches.find((entry) => entry.range === range);
    if (match) return match.quality > 0 && match.quality <= 1;
  }
  return false;
};

/** 成功応答をAcceptで拒否するリクエストへ406を返す。 */
export const acceptResponse =
  (mediaType: string): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!accepts(c.req.header('Accept'), mediaType)) return problem(c, 406);
    await next();
  };

/** HonoのJSON検証より先に、非JSONの本文を415で拒否する。 */
export const requireJson: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return problem(c, 415);
  await next();
};
