/**
 * 旧APIのルートとOpenAPI応答を提供する。
 * 公開パスに/v1接頭辞は付けず、Worker側で従来のルート直下へマウントする。
 * @packageDocumentation
 */
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Handler } from 'hono';
import type { AppEnv } from '@/types/env';
import createPrRoute from './routes/create-pr';
import docsRoute from './routes/docs';
import downloadFilePathsRoute from './routes/download-file-paths';
import downloadFilesRoute from './routes/download-files';
import healthRoute from './routes/health';
import { issueRoutes } from './routes/issue';
import { treeRoutes } from './routes/tree';
import { treeMetadataRoutes } from './routes/tree-metadata';

const packageJson = await import('../../../package.json', { with: { type: 'json' } });

/** 旧APIの操作だけを登録し、v2を含まないOpenAPIドキュメントを構築する。 */
const app = new OpenAPIHono<AppEnv>();
app.route('/', createPrRoute);
app.route('/', docsRoute);
app.route('/', downloadFilesRoute);
app.route('/', downloadFilePathsRoute);
app.route('/issue', issueRoutes);
app.route('/tree', treeRoutes);
app.route('/tree-metadata', treeMetadataRoutes);
app.route('/', healthRoute);

/**
 * リクエスト先が移行前のworkers.devホストか判定する。
 *
 * @param url 判定対象の絶対URL。
 * @returns ホスト名が旧APIのホスト名と一致する場合はtrue。
 * @throws {TypeError} 有効な絶対URLでない場合。
 */
export const isLegacyUrl = (url: string): boolean =>
  new URL(url).hostname === 'dcs-translation-japanese-cloudflare-worker.dcs-translation-japanese.workers.dev';

/**
 * 正式URLを案内する旧APIのOpenAPIドキュメントを返す。
 * 旧ホストからの取得時のみ移行案内と全操作の非推奨表示を追加する。
 *
 * @param c リクエストのコンテキスト。
 * @returns OpenAPIのJSON応答。生成に失敗した場合は既存どおり500を返す。
 */
export const getOpenApi: Handler<AppEnv> = (c) => {
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
};

export default app;
