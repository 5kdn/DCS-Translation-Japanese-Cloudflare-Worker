/**
 * PRの契約を公開し、実装済み操作をv2アプリへ登録する。
 * @packageDocumentation
 */
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { problem } from '../../app';
import { createPullRequest, createPullRequestHandler } from './create';
import { getPullRequest, getPullRequestHandler } from './get';
import { listPullRequests, listPullRequestsHandler } from './list';

/** PRに属する操作のOpenAPI定義。 */
export const pullRequestRoutes = {
  listPullRequests,
  createPullRequest,
  getPullRequest,
};

/**
 * PRの公開読み取り・作成操作と、未対応メソッドへの405応答を登録する。
 * @param app v2共通の入力検証・Problem Details処理を設定済みのアプリ。
 * @returns なし。渡されたアプリにルートを追加する。
 */
export const registerPullRequestRoutes = (app: OpenAPIHono<AppEnv>): void => {
  app.openapi(getPullRequest, getPullRequestHandler);
  app.openapi(listPullRequests, listPullRequestsHandler);
  app.openapi(createPullRequest, createPullRequestHandler);
  app.all('/prs', (c) => problem(c, 405, { Allow: 'GET, HEAD, POST' }));
  app.all('/prs/:number', (c) => problem(c, 405, { Allow: 'GET, HEAD' }));
};
