/**
 * v2の各リソースで共有するGitHub App接続と依存先エラーの変換を提供する。
 * @packageDocumentation
 */
import { z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { App as GitHubApp } from 'octokit';
import { getRequiredEnvNumber, getRequiredEnvString } from '@/helpers/environmentHelper';
import type { GitHubContext } from '@/services/githubService';
import type { Bindings } from '@/types/env';

/**
 * 依存先の利用不可を示す503例外を、整数秒の再試行案内付きで作る。
 * @param seconds 再試行まで待つ秒数。省略時は60秒。
 * @returns Retry-Afterを保持するHTTP例外。
 */
export const dependencyUnavailable = (seconds = 60): HTTPException =>
  new HTTPException(503, {
    res: new Response(null, { status: 503, headers: { 'Retry-After': String(seconds) } }),
  });

/**
 * GitHubへの通信と応答検証の失敗を、内部情報を含まないv2エラーへ変換する。
 * @param action GitHubへのリクエストと応答検証を行う処理。
 * @param allowNotFound 対象不存在の404をそのまま公開するかどうか。
 * @returns 処理の成功結果。
 * @throws {HTTPException} 対象不存在は404、依存先の利用不可・回数制限は503、その他は502。
 */
export const githubRequest = async <T>(action: () => Promise<T>, allowNotFound = false): Promise<T> => {
  try {
    return await action();
  } catch (error) {
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
    throw new HTTPException(502);
  }
};

/**
 * 必須設定を検証し、設定済みリポジトリのGitHub Appクライアントを作る。
 * @param env Workerのバインディング。
 * @returns インストール認証済みクライアントとリポジトリ情報。
 */
export const getGitHubContext = async (env: Bindings): Promise<GitHubContext> => {
  const appId = getRequiredEnvNumber('TARGET_GH_APP_ID', env.TARGET_GH_APP_ID);
  const privateKey = getRequiredEnvString('TARGET_GH_APP_PRIVATE_KEY', env.TARGET_GH_APP_PRIVATE_KEY);
  const installationId = getRequiredEnvNumber('TARGET_GH_INSTALLATION_ID', env.TARGET_GH_INSTALLATION_ID);
  const owner = getRequiredEnvString('TARGET_GH_OWNER', env.TARGET_GH_OWNER);
  const repo = getRequiredEnvString('TARGET_GH_REPO', env.TARGET_GH_REPO);
  const octokit = await githubRequest(() => new GitHubApp({ appId, privateKey }).getInstallationOctokit(installationId));
  return { octokit, owner, repo, defaultBranch: (env.TARGET_GH_DEFAULT_BRANCH || 'master').trim() };
};
