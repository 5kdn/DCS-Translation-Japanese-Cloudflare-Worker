import { z } from '@hono/zod-openapi';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@/types/env';
import { acceptResponse, requireJson } from '../app';

export const numberSchema = z.number().int().min(1).max(2147483647);

export const dateTimeSchema = z.iso.datetime({ offset: true });

export const shaSchema = z.string().regex(/^[0-9a-f]{40}([0-9a-f]{24})?$/);

export const pathSchema = z.string().min(1).max(4096);

export const titleSchema = z.string().min(1).max(256);

export const problemSchema = z
  .looseObject({
    type: z.url(),
    title: z.string(),
    status: z.number().int().min(400).max(599),
    detail: z.string(),
    instance: z
      .string()
      .refine((value) => {
        try {
          return !/\s|%(?![0-9a-f]{2})/i.test(value) && Boolean(new URL(value, 'https://example.com'));
        } catch {
          return false;
        }
      })
      .openapi({ format: 'uri-reference' }),

    code: z.enum([
      'INVALID_REQUEST',
      'INVALID_CURSOR',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'METHOD_NOT_ALLOWED',
      'NOT_ACCEPTABLE',
      'CONFLICT',
      'REPLAY_DETECTED',
      'PAYLOAD_TOO_LARGE',
      'URI_TOO_LONG',
      'UNSUPPORTED_MEDIA_TYPE',
      'UNPROCESSABLE_CONTENT',
      'SNAPSHOT_LIMIT_EXCEEDED',
      'RATE_LIMITED',
      'INTERNAL_ERROR',
      'UPSTREAM_ERROR',
      'SERVICE_UNAVAILABLE',
    ]),
  })

  .openapi('Problem');

export const pageSchema = z.strictObject({ nextCursor: z.string().max(2048).nullable() }).openapi('Page');

export const emptyQuerySchema = z.strictObject({});

export const numberParamSchema = z.object({ number: z.coerce.number().int().min(1).max(2147483647) });

export const listQuerySchema = z.strictObject({
  state: z.enum(['open', 'closed', 'all']).openapi({ default: 'open' }).optional(),
  limit: z.coerce.number().int().min(1).max(100).openapi({ default: 20 }).optional(),
  cursor: z.string().min(1).max(2048).optional(),
});

export const failure = { description: 'Problem Details', content: { 'application/problem+json': { schema: problemSchema } } };
export const readFailures = { 400: failure, 406: failure, 500: failure, 502: failure, 503: failure, default: failure };

export const writeFailures = {
  ...readFailures,
  409: failure,
  413: failure,
  415: failure,
  422: failure,
  429: {
    ...failure,
    headers: z.object({
      'Retry-After': z
        .number()
        .int()
        .min(1)
        .max(300)
        .openapi({ param: { description: '再試行までの待機時間（秒）。' } }),
    }),
  },
};
export const jsonMiddleware: [MiddlewareHandler<AppEnv>] = [acceptResponse('application/json')];
export const bodyMiddleware: [MiddlewareHandler<AppEnv>, MiddlewareHandler<AppEnv>] = [
  acceptResponse('application/json'),
  requireJson,
];
export const emptyRequest = { query: emptyQuerySchema };
