import { SwaggerUI } from '@hono/swagger-ui';
import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { acceptResponse } from '../app';
import { emptyRequest, failure } from './common';

export const docsSchema = z.string().min(1);

export const getDocs = createRoute({
  operationId: 'getDocs',
  method: 'get',
  path: '/docs',
  security: [],
  middleware: [acceptResponse('text/html')] as const,

  request: emptyRequest,
  responses: { 200: { description: 'Swagger UI。', content: { 'text/html': { schema: docsSchema } } }, default: failure },
});

/** Swagger UIを公開する。 */
export const registerDocsRoutes = (app: OpenAPIHono<AppEnv>): void => {
  app.openapi(getDocs, (c) => c.html(SwaggerUI({ url: '/v2/openapi.json' }), 200));
};
