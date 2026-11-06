/**
 * v2専用の入力検証・操作登録・Problem Details応答を提供する。
 * 旧APIのルーティングやエラー処理には適用しない。
 * @packageDocumentation
 */
import type { Context, Handler, MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from '@/types/env';
import { operations } from './generated/operations';
import type { components } from './generated/types';
import { requests, responses } from './generated/validators.js';

/** OASで定義したv2の共通エラー本文。 */
type Problem = components['schemas']['Problem'];
/** OASから生成した操作識別子。 */
type OperationId = keyof typeof operations;
/** 操作ハンドラーへ渡す検証済みのパス・クエリ・JSON本文。 */
type Input = { path: Record<string, string>; query: Record<string, string>; body?: unknown };
/** Workerの環境バインディングと、v2の検証済み入力を保持するコンテキスト変数。 */
export type V2Env = AppEnv & { Variables: { v2Input: Input } };

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
export const createV2App = (): Hono<V2Env> => {
  const app = new Hono<V2Env>();
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

/**
 * OASの入力スキーマと成功応答のメディアタイプを検証する。
 * JSON本文の型は変換せず、検証済み入力をc.get('v2Input')へ格納する。
 *
 * @param id 検証に使用するOASのoperationId。
 * @returns 入力不正時にProblem Detailsを返し、成功時に後続へ進むミドルウェア。
 */
export const validateOperation =
  (id: OperationId): MiddlewareHandler<V2Env> =>
  async (c, next) => {
    const operation = operations[id];
    const success = Object.entries(operation.responses).find(([status]) => status.startsWith('2'));
    const mediaTypes = Object.keys(success?.[1] ?? {});
    if (!mediaTypes.some((mediaType) => accepts(c.req.header('Accept'), mediaType))) return problem(c, 406);
    const query: Record<string, string> = Object.create(null);
    for (const [name, values] of Object.entries(c.req.queries())) {
      if (values.length !== 1) return problem(c, 400);
      query[name] = values[0] ?? '';
    }
    const input: Input = { path: c.req.param(), query };
    if (operation.hasBody) {
      if (c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return problem(c, 415);
      try {
        input.body = await c.req.json();
      } catch {
        return problem(c, 400);
      }
    }
    if (!requests[id]?.(input)) return problem(c, 400);
    if (operation.bodyValidator && !responses[operation.bodyValidator]?.(input.body)) return problem(c, 400);
    c.set('v2Input', input);
    await next();
  };

/**
 * OASのmethod/pathに入力検証と操作ハンドラーを登録する。
 * パスの/v2接頭辞は親アプリへのマウント時に付与する。
 *
 * @param app createV2Appで作成した登録先のアプリ。
 * @param id 登録するOASのoperationId。
 * @param handler 検証済み入力を処理するハンドラー。
 */
export const registerOperation = (app: Hono<V2Env>, id: OperationId, handler: Handler<V2Env>): void => {
  const operation = operations[id];
  const path = operation.path.slice('/v2'.length).replace(/\{([^}]+)\}/g, ':$1');
  app.on(operation.method, path, validateOperation(id), handler);
};
