/**
 * GitHubサービスの公開窓口。旧APIで使用する関数・型のimport先を維持する。
 * HTTP応答への変換は各API側で行う。
 * @packageDocumentation
 */
export { createGitHubContext, type GitHubConfig, type GitHubContext, getGitHubConfig } from './context';
export { createIssue, getIssues } from './issues';
export { createPullRequest } from './pullRequests';
export { fetchRepositoryFile, getFilteredTreeItems } from './repository';
export type { GetIssuesItem, GetIssuesRequest, GetIssuesResult } from './types';
