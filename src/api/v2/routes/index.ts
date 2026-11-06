import { createRoute, z } from '@hono/zod-openapi';
import { emptyRequest, failure, jsonMiddleware } from './common';
/** v2のルート定義を集約する。未実装の操作はOpenAPIへの掲載だけに使用する。 */

import { getDocs } from './docs';
import { fileRoutes } from './files';
import { getHealth } from './health';
import { issueRoutes } from './issue';
import { pullRequestRoutes } from './pull-request';
import { treeRoutes } from './tree';
import { treeMetadataRoutes } from './tree-metadata';

export const openApiSchema = z.looseObject({
  openapi: z.string(),
  info: z.record(z.string(), z.unknown()),
  paths: z.record(z.string(), z.unknown()),
});

export const getOpenApi = createRoute({
  operationId: 'getOpenApi',
  method: 'get',
  path: '/openapi.json',
  security: [],
  middleware: jsonMiddleware,
  request: emptyRequest,

  responses: {
    200: { description: '公開するOpenAPI仕様。', content: { 'application/json': { schema: openApiSchema } } },
    default: failure,
  },
});

export const routes = {
  ...issueRoutes,
  ...pullRequestRoutes,
  ...treeRoutes,
  ...fileRoutes,
  ...treeMetadataRoutes,
  getOpenApi,
  getDocs,
  getHealth,
};
