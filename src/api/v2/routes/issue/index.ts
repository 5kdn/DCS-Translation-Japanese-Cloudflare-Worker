/**
 * Issueの契約を公開し、実装済み操作をv2アプリへ登録する。
 * @packageDocumentation
 */
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { problem } from '../../app';
import { createIssue } from './create';
import { getIssue, getIssueHandler } from './get';
import { listIssues, listIssuesHandler } from './list';
import { updateIssue } from './update';

/** Issueに属する操作のOpenAPI定義。 */
export const issueRoutes = {
  listIssues,
  createIssue,
  getIssue,
  updateIssue,
};

/**
 * Issueの公開GET操作と、未対応メソッドへの405応答を登録する。
 * @param app v2共通の入力検証・Problem Details処理を設定済みのアプリ。
 * @returns なし。渡されたアプリにルートを追加する。
 */
export const registerIssueRoutes = (app: OpenAPIHono<AppEnv>): void => {
  app.openapi(getIssue, getIssueHandler);
  app.openapi(listIssues, listIssuesHandler);
  for (const path of ['/issues', '/issues/:number']) {
    app.all(path, (c) => problem(c, 405, { Allow: 'GET, HEAD' }));
  }
};
