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
import type { AppEnv } from '@/types/env';
import type { problemSchema } from './routes/common';

/** v2の共通エラー本文。 */
type Problem = z.infer<typeof problemSchema>;

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
 * @returns クエリ文字列や内部例外を含まないapplication/problem+json応答。
 */
export const problem = (c: Context, status: ContentfulStatusCode, headers?: HeadersInit): Response => {
  const [title, code] = failures[status] ?? ['Internal Server Error', 'INTERNAL_ERROR'];
  const body: Problem = {
    type: 'about:blank',
    title,
    status,
    detail: title,
    instance: c.req.path,
    code,
  };
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/problem+json');
  responseHeaders.delete('Content-Length');
  return c.newResponse(JSON.stringify(body), { status, headers: responseHeaders });
};

/**
 * v2専用の共通ミドルウェアと例外処理を設定したアプリを作成する。
 * リクエストターゲットは8192バイト、本文は5 MiBを上限とする。
 *
 * @returns 操作の登録先となるHonoアプリ。旧APIとはエラー処理を共有しない。
 */
export const createV2App = (): OpenAPIHono<AppEnv> => {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) return problem(c, 400);
    },
  });
  app.onError((error, c) => {
    if (error instanceof HTTPException) return problem(c, error.status, error.getResponse().headers);
    console.error('v2 request failed', error);
    return problem(c, 500);
  });
  app.use('*', async (c, next) => {
    const url = new URL(c.req.url);
    if (new TextEncoder().encode(url.pathname + url.search).length > 8192) return problem(c, 414);
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
