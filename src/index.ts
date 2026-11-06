import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import createPrRoute from '@/routes/create-pr';
import docsRoute from '@/routes/docs';
import downloadFilePathsRoute from '@/routes/download-file-paths';
import downloadFilesRoute from '@/routes/download-files';
import healthRoute from '@/routes/health';
import { issueRoutes } from '@/routes/issue';
import type { AppEnv } from '@/types/env';
import { scheduled } from './handlers/scheduled';
import { treeRoutes } from './routes/tree';
import { treeMetadataRoutes } from './routes/tree-metadata';

const packageJson = await import('../package.json', { with: { type: 'json' } });

const app = new OpenAPIHono<AppEnv>();

/**
 * リクエスト先が移行前のworkers.devホストか判定する。
 *
 * @param url 判定対象の絶対URL。
 * @returns ホスト名が旧APIのホスト名と一致する場合はtrue。
 * @throws {TypeError} 有効な絶対URLでない場合。
 */
const isLegacyUrl = (url: string): boolean =>
  new URL(url).hostname === 'dcs-translation-japanese-cloudflare-worker.dcs-translation-japanese.workers.dev';

/**
 * 旧URLへのリクエストに非推奨の開始日時と廃止期限を示すヘッダーを付与する。
 * エラーレスポンスも対象とし、新URLへのリダイレクトは行わない。
 */
app.use('*', async (c, next) => {
  if (isLegacyUrl(c.req.url)) {
    // RFC 9745のStructured Field Date。2026-11-06 00:00:00 UTCから非推奨。
    c.header('Deprecation', '@1793923200');
    c.header('Sunset', 'Fri, 31 Dec 2027 14:59:59 GMT');
  }
  await next();
});

/**
 * 新URLを接続先とするOpenAPIドキュメントを返す。
 * 旧URLからの取得時のみ移行案内と全操作の非推奨表示を追加し、
 * 新URLで取得するドキュメントには影響させない。生成失敗時は500を返す。
 */
app.get('/openapi.json', (c) => {
  try {
    const document = app.getOpenAPIDocument({
      openapi: '3.1.0',
      info: {
        title: 'DCS Translation Japanese API',
        version: packageJson.version,
      },
      servers: [
        {
          url: 'https://api.dcs-translation-japanese.workers.dev',
          description: 'DCS Translation Japanese の翻訳ファイルを取得・配布・登録する API サーバー。',
        },
      ],
    });
    if (isLegacyUrl(c.req.url)) {
      document.info.description =
        'この旧URLは非推奨です。https://api.dcs-translation-japanese.workers.dev を使用してください。旧URLの廃止期限は2027年12月31日23:59:59（日本時間）です。それまでに新URLへ移行してください。';
      for (const path of Object.values(document.paths ?? {})) {
        for (const method of ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const) {
          const operation = path?.[method];
          if (operation) operation.deprecated = true;
        }
      }
    }
    return c.json(document);
  } catch (error) {
    return c.json(error, 500);
  }
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
    exposeHeaders: ['Deprecation', 'Sunset'],
    credentials: true,
    maxAge: 24 * 60 * 60,
  }),
);

// mount routes
app.route('/', createPrRoute);
app.route('/', docsRoute);
app.route('/', downloadFilesRoute);
app.route('/', downloadFilePathsRoute);
app.route('/issue', issueRoutes);
app.route('/tree', treeRoutes);
app.route('/tree-metadata', treeMetadataRoutes);
app.route('/', healthRoute);

export default {
  fetch: app.fetch,
  scheduled,
};
