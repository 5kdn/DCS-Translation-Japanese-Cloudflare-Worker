import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import createIssueRoute from '@/routes/create-issue';
import createPrRoute from '@/routes/create-pr';
import docsRoute from '@/routes/docs';
import downloadFilePathsRoute from '@/routes/download-file-paths';
import downloadFilesRoute from '@/routes/download-files';
import healthRoute from '@/routes/health';
import treeRoute from '@/routes/tree';
import type { AppEnv } from '@/types/env';

const packageJson = await import('../package.json', { assert: { type: 'json' } });

const app = new OpenAPIHono<AppEnv>();

// OpenAPI document endpoint
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'DCS Translation Japanese API',
    version: packageJson.version,
  },
  servers: [
    {
      url: `https://${packageJson.name}.dcs-translation-japanese.workers.dev`,
      description: 'DCS Translation Japanese の翻訳ファイルを取得・配布・登録する API サーバー。',
    },
  ],
});

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

// mount routes
app.route('/', createIssueRoute);
app.route('/', createPrRoute);
app.route('/', docsRoute);
app.route('/', downloadFilesRoute);
app.route('/', downloadFilePathsRoute);
app.route('/', healthRoute);
app.route('/', treeRoute);
export default app;
