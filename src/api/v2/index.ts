/**
 *  v2の公開ルート。仕様にある未実装の操作は404を返す。
 * @packageDocumentation
 */
import { OpenAPIHono } from '@hono/zod-openapi';
import { createV2App, problem } from './app';
import { openApiSchema, routes } from './routes';
import { registerDocsRoutes } from './routes/docs';
import { registerHealthRoutes } from './routes/health';

const app = createV2App();
registerHealthRoutes(app);
app.openapi(routes.getOpenApi, (c) =>
  c.json(
    openApiSchema.parse(
      documentation.getOpenAPI31Document({
        openapi: '3.1.0',
        info: {
          title: 'DCS日本語翻訳API v2',
          version: '2.0.0',
          description: 'DCS日本語翻訳のIssue・PR・ファイル情報・更新日時を扱うAPI。',
        },
        servers: [{ url: 'https://api.dcs-translation-japanese.workers.dev' }],
      }),
    ),
    200,
  ),
);
registerDocsRoutes(app);

for (const route of Object.values(routes)) {
  if (route === routes.getHealth || route === routes.getOpenApi || route === routes.getDocs) continue;
  const { middleware: _middleware, ...definition } = route;
  app.openAPIRegistry.registerPath(definition);
}
app.openAPIRegistry.registerComponent('securitySchemes', 'githubActionsOidc', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'GitHub ActionsのOIDC IDトークン（audience: tree-metadata）。',
});
// 親Workerは通常のHonoなので、仕様のパスにも明示的に/v2を付ける。
const documentation = new OpenAPIHono().route('/v2', app);

for (const path of ['/health', '/openapi.json', '/docs']) {
  app.all(path, (c) => problem(c, 405, { Allow: 'GET, HEAD' }));
}
app.all('*', (c) => problem(c, 404));
export default app;
