import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { dateTimeSchema, emptyRequest, jsonMiddleware, readFailures } from './common';

export const healthSchema = z
  .strictObject({
    status: z.literal('ok'),
    timestamp: dateTimeSchema,
  })
  .openapi('Health');

export const getHealth = createRoute({
  operationId: 'getHealth',
  method: 'get',
  path: '/health',
  security: [],
  middleware: jsonMiddleware,
  request: emptyRequest,
  responses: {
    200: { description: 'Workerの稼働状態。', content: { 'application/json': { schema: healthSchema } } },
    ...readFailures,
  },
});

/** ヘルスチェックを公開する。 */
export const registerHealthRoutes = (app: OpenAPIHono<AppEnv>): void => {
  app.openapi(getHealth, (c) => c.json({ status: 'ok' as const, timestamp: new Date().toISOString() }, 200));
};
