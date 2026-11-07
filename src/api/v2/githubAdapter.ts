/**
 * v2の各リソースで共有するGitHub App接続と依存先エラーの変換を提供する。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { createGitHubContext, type GitHubContext, getGitHubConfig } from '@/services/githubService';
import type { Bindings } from '@/types/env';

import { dependencyUnavailable } from './app';

/**
 * GitHubへの通信と応答検証の失敗を、内部情報を含まないv2エラーへ変換する。
 * @param action GitHubへのリクエストと応答検証を行う処理。
 * @param allowNotFound 対象不存在の404をそのまま公開するかどうか。
 * @param write 書き込みの権限不足・競合・内容不整合を公開するかどうか。
 * @returns 処理の成功結果。
 * @throws {HTTPException} 対象不存在は404、依存先の利用不可・回数制限は503、その他は502。
 */
export const githubRequest = async <T>(action: () => Promise<T>, allowNotFound = false, write = false): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    const failure = z
      .object({
        status: z.number().optional(),
        message: z.string().optional(),
        response: z.object({ headers: z.record(z.string(), z.unknown()).optional() }).optional(),
      })
      .safeParse(error);
    const status = failure.success ? failure.data.status : undefined;
    const headers = failure.success ? failure.data.response?.headers : undefined;
    if (status === 404 && allowNotFound) throw new HTTPException(404);
    if (
      status === 503 ||
      status === 429 ||
      error instanceof TypeError ||
      (status === 403 &&
        (headers?.['x-ratelimit-remaining'] === '0' ||
          headers?.['retry-after'] !== undefined ||
          (failure.success && /rate limit/i.test(failure.data.message ?? ''))))
    ) {
      const retry = Number(headers?.['retry-after']);
      const reset = Number(headers?.['x-ratelimit-reset']) * 1000;
      const seconds =
        Number.isFinite(retry) && retry > 0
          ? Math.ceil(retry)
          : Number.isFinite(reset) && reset > Date.now()
            ? Math.ceil((reset - Date.now()) / 1000)
            : 60;
      throw dependencyUnavailable(seconds);
    }
    if (write && (status === 403 || status === 409 || status === 422)) throw new HTTPException(status);
    throw new HTTPException(502);
  }
};

/**
 * 必須設定を検証し、設定済みリポジトリのGitHub Appクライアントを作る。
 * @param env Workerのバインディング。
 * @returns インストール認証済みクライアントとリポジトリ情報。
 */
export const getGitHubContext = async (env: Bindings): Promise<GitHubContext> => {
  const config = getGitHubConfig(env);
  return githubRequest(() => createGitHubContext(config));
};
