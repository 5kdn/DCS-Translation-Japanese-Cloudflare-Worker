// src/routes/health.ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';

const r = new OpenAPIHono<AppEnv>();

const HealthResponse = z.object({
  status: z.literal('ok'),
  timestamp: z.string().openapi({ format: 'date-time' }),
});

const route = createRoute({
  method: 'get',
  path: '/health',
  tags: ['health'],
  summary: 'アプリケーションのヘルスチェック',
  description:
    'アプリケーションが稼働中であることを確認するためのエンドポイント。\n' +
    'システム監視や Kubernetes の Liveness Probe などに利用できる。\n' +
    '成功時には HTTP 200 とともに現在時刻を ISO 8601 形式で返す。',
  responses: {
    200: {
      description: 'Liveness probe',
      content: {
        'application/json': {
          schema: HealthResponse,
        },
      },
    },
  },
});

r.openapi(route, async (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default r;
