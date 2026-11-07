/**
 * GitHub App接続設定の検証と、認証済みクライアントの生成を提供する。
 * API固有のHTTPエラー変換は行わない。
 * @packageDocumentation
 */
import { App as GitHubApp, type Octokit } from 'octokit';
import { getRequiredEnvNumber, getRequiredEnvString } from '@/helpers/environmentHelper';
import type { Bindings } from '@/types/env';

/** GitHub操作に使用する認証済みクライアントと対象リポジトリの情報。 */
export type GitHubContext = { octokit: Octokit; owner: string; repo: string; defaultBranch: string };

/** Workerのバインディングから検証済みのGitHub App接続設定。 */
export type GitHubConfig = {
  appId: number;
  privateKey: string;
  installationId: number;
  owner: string;
  repo: string;
  defaultBranch: string;
};

/**
 * Workerの必須設定を検証し、GitHub App接続設定を取得する。
 *
 * @param env GitHub Appの認証情報・対象リポジトリ・既定ブランチを含むWorkerのバインディング。
 * @returns 数値化したApp ID・installation ID、秘密鍵、owner・repo・既定ブランチ。
 * 既定ブランチが未設定または空文字の場合はmasterを使用し、前後の空白を除去する。
 * @throws {Error} 必須設定が未設定・空白のみの場合、またはIDを有限の数値へ変換できない場合。
 */
export const getGitHubConfig = (env: Bindings): GitHubConfig => ({
  appId: getRequiredEnvNumber('TARGET_GH_APP_ID', env.TARGET_GH_APP_ID),
  privateKey: getRequiredEnvString('TARGET_GH_APP_PRIVATE_KEY', env.TARGET_GH_APP_PRIVATE_KEY),
  installationId: getRequiredEnvNumber('TARGET_GH_INSTALLATION_ID', env.TARGET_GH_INSTALLATION_ID),
  owner: getRequiredEnvString('TARGET_GH_OWNER', env.TARGET_GH_OWNER),
  repo: getRequiredEnvString('TARGET_GH_REPO', env.TARGET_GH_REPO),
  defaultBranch: (env.TARGET_GH_DEFAULT_BRANCH || 'master').trim(),
});

/**
 * GitHub Appのインストール認証を行い、操作用コンテキストを生成する。
 *
 * @param config getGitHubConfigで検証済みのGitHub App認証情報と対象リポジトリの設定。
 * @returns インストール認証済みのOctokitと、owner・repo・既定ブランチを持つコンテキスト。
 * @throws GitHub Appの生成・インストール認証に失敗した場合、そのエラーを変換せず伝播する。
 */
export const createGitHubContext = async (config: GitHubConfig): Promise<GitHubContext> => {
  const { appId, privateKey, installationId, owner, repo, defaultBranch } = config;
  const octokit = await new GitHubApp({ appId, privateKey }).getInstallationOctokit(installationId);
  return { octokit, owner, repo, defaultBranch };
};
