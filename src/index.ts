/**
 * 共通のホスト移行案内・CORSを適用し、旧APIとv2をWorkerへ組み込む。
 * API固有のルート・入力検証・エラー処理は各バージョン内で管理する。
 * @packageDocumentation
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import v1, { getOpenApi, isLegacyUrl } from '@/api/v1';
import v2 from '@/api/v2';
import type { AppEnv } from '@/types/env';
import { scheduled } from './handlers/scheduled';

const app = new Hono<AppEnv>();
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

/** 旧APIの仕様書は、従来どおりCORSミドルウェアより先に応答する。 */
app.get('/openapi.json', getOpenApi);

app.use('*', (c, next) =>
  cors({
    origin: (origin, c) => {
      if (!origin) return null;
      const allows = String(c.env.AllowOrigins ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return allows.includes(origin) ? origin : null;
    },
    allowMethods: c.req.path.startsWith('/v2/') ? ['GET', 'POST', 'PATCH', 'OPTIONS'] : ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: c.req.path.startsWith('/v2/') ? ['Deprecation', 'Sunset', 'Retry-After'] : ['Deprecation', 'Sunset'],
    credentials: true,
    maxAge: 24 * 60 * 60,
  })(c, next),
);

/** v2の入力検証・エラー形式は専用アプリ内に閉じ、旧APIへ適用しない。 */
app.route('/v2', v2);
/** 旧APIの公開パスは変更せず、従来どおりルート直下で提供する。 */
app.route('/', v1);

export default {
  fetch: app.fetch,
  scheduled,
};
