/**
 * 開発用のOpenAPI・CORS設定で旧APIとv2を提供するWorkerエントリーポイント。
 * 公開パスと定期処理は既存の開発環境の動作を維持する。
 * @packageDocumentation
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import v1 from '@/api/v1';
import v2 from '@/api/v2';
import type { AppEnv } from '@/types/env';
import { scheduled } from './handlers/scheduled';

const packageJson = await import('../package.json', { with: { type: 'json' } });

const app = new Hono<AppEnv>();

// OpenAPI document endpoint
app.get('/openapi.json', (c) =>
  c.json(
    v1.getOpenAPIDocument({
      openapi: '3.1.0',
      info: {
        title: 'DCS Translation Japanese API',
        version: packageJson.version,
      },
      servers: [
        {
          url: 'http://127.0.0.1:8787',
          description: 'DCS Translation Japanese の翻訳ファイルを取得・配布・登録する API サーバー。',
        },
      ],
    }),
  ),
);

// set CORS for all endpoints
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (!origin) return null;
      const allows = String(c.env.AllowOrigins ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return allows.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 24 * 60 * 60,
  }),
);

app.route('/v2', v2);
/** 本番用と同じ旧APIルートを、既存の開発用設定の下へ登録する。 */
app.route('/', v1);

export default {
  fetch: app.fetch,
  scheduled,
};
