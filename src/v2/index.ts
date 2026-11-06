/**
 * 認証不要のhealth・OpenAPI仕様・Swagger UIをv2専用アプリへ登録する。
 * 未実装のOAS操作は404、実装済みパスの未対応メソッドは405を返す。
 * @packageDocumentation
 */
import { swaggerUI } from '@hono/swagger-ui';
import { createV2App, problem, registerOperation } from './app';
import type { components } from './generated/types';
import specification from './openapi.json';

/** 親アプリの/v2へマウントする公開エンドポイント群。 */
const app = createV2App();
registerOperation(app, 'getHealth', (c) => {
  const health: components['schemas']['Health'] = { status: 'ok', timestamp: new Date().toISOString() };
  return c.json(health);
});
registerOperation(app, 'getOpenApi', (c) => c.json(specification));
registerOperation(app, 'getDocs', swaggerUI({ url: '/v2/openapi.json' }));

// Only implemented operations participate in method dispatch; future OAS paths stay 404.
for (const path of ['/health', '/openapi.json', '/docs']) {
  app.all(path, (c) => problem(c, 405, { Allow: 'GET, HEAD' }));
}
app.all('*', (c) => problem(c, 404));
export default app;
