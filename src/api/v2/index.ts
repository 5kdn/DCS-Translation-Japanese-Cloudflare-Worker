/**
 * v2の公開ルート・読み取り操作を登録し、全操作のOpenAPI仕様を配信する。
 * 未実装の書き込み操作は仕様への掲載のみで、実行しない。
 * @packageDocumentation
 */
import { OpenAPIHono } from '@hono/zod-openapi';
import { createV2App, problem } from './app';
import { openApiSchema, routes } from './routes';
import { registerDocsRoutes } from './routes/docs';
import { registerFileRoutes } from './routes/files';
import { registerHealthRoutes } from './routes/health';
import { registerIssueRoutes } from './routes/issue';
import { registerPullRequestRoutes } from './routes/pull-request';
import { registerTreeRoutes } from './routes/tree';

const app = createV2App();
registerHealthRoutes(app);
registerIssueRoutes(app);
registerPullRequestRoutes(app);
registerTreeRoutes(app);
registerFileRoutes(app);
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
  if (route.method === 'get') continue;
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
