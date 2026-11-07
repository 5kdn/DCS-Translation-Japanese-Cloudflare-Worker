/**
 * 旧APIのIssue作成・一覧取得と、その入力検証を提供する。
 * @packageDocumentation
 */
import { UserFacingError } from '@/errors/userFacingError';
import type { IssuePayload, IssueResult } from '@/types/types';
import type { GitHubContext } from './context';
import { VALIDATION_ERROR_CODE, ValidationError } from './errors';
import type { GetIssuesRequest, GetIssuesResult, GitHubOperationFailure } from './types';

/**
 * @summary GitHub 上で Issue を作成する。
 * @param payload Issue のタイトルや本文、付与するラベル・アサインを受け取る。
 * @param ctx Octokit や owner/repo などの GitHub コンテキストを受け取る。
 * @returns 作成された Issue の番号と URL を返す。
 * @throws {UserFacingError} Issue 作成が無効化されている場合や権限が不足している場合に投げる。
 */
export const createIssue = async (payload: IssuePayload, ctx: GitHubContext): Promise<IssueResult | GitHubOperationFailure> => {
  try {
    _assertIssuePayload(payload);
    const { octokit, owner, repo } = ctx;
    const title = payload.title.trim();
    const labels = _normalizeStringArray(payload.labels);
    const assignees = _normalizeStringArray(payload.assignees);
    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body: payload.body,
      labels,
      assignees,
    });
    return {
      issueNumber: issue.data.number,
      issueUrl: issue.data.html_url,
    };
  } catch (err: unknown) {
    if (err instanceof UserFacingError) throw err;
    if (err instanceof ValidationError) return { error: 'validation error', detail: err.message, code: VALIDATION_ERROR_CODE };
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const status = (err as { status?: number }).status;
      if (status === 410) throw new UserFacingError('ISSUES_DISABLED', 403, 'Issue の作成が無効化されている。');
      if (status === 401 || status === 403) throw new UserFacingError('FORBIDDEN', 403, 'Issue を作成する権限がない。');
      if (status === 404) throw new UserFacingError('NOT_FOUND', 404, 'リポジトリが見つからない。');
    }
    if (err instanceof Error) return { error: 'failed to create issue', detail: err.message };
    return { error: 'failed to create issue', detail: String(err) };
  }
};

/**
 * @summary GitHub 上の Issue 一覧を取得する
 * @param ctx Octokit や owner/repo などの GitHub コンテキストを受け取る。
 */
export const getIssues = async (
  ctx: GitHubContext,
  req: GetIssuesRequest = {},
): Promise<GetIssuesResult | GitHubOperationFailure> => {
  const { octokit, owner, repo } = ctx;
  try {
    const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner,
      repo,
      state: req.state ?? 'open',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    return issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        issueNumber: issue.number,
        title: issue.title,
        body: issue.body ?? null,
        issueUrl: issue.html_url,
        state: issue.state as 'open' | 'closed',
        closedAt: issue.closed_at ?? null,
        updatedAt: issue.updated_at,
        createdAt: issue.created_at,
        labels: issue.labels
          .map((label) => (typeof label === 'string' ? label : label?.name))
          .filter((name): name is string => typeof name === 'string' && name.length > 0),
        assignees: (issue.assignees ?? [])
          .map((assignee) => assignee?.login)
          .filter((login): login is string => typeof login === 'string' && login.length > 0),
      }));
  } catch (err: unknown) {
    if (err instanceof UserFacingError) throw err;
    if (err instanceof ValidationError) return { error: 'validation error', detail: err.message, code: VALIDATION_ERROR_CODE };
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) throw new UserFacingError('FORBIDDEN', 403, 'Issue 一覧を取得する権限がない。');
      if (status === 404) throw new UserFacingError('NOT_FOUND', 404, 'リポジトリが見つからない。');
    }
    if (err instanceof Error) return { error: 'failed to get issues', detail: err.message };
    return { error: 'failed to get issues', detail: String(err) };
  }
};

const _assertIssuePayload = (payload: IssuePayload): void => {
  if (!payload?.title?.trim()) throw new ValidationError('title は必須');
  if (payload.body !== undefined && typeof payload.body !== 'string') throw new ValidationError('body は string で指定する');
  if (payload.labels !== undefined) {
    if (!Array.isArray(payload.labels)) throw new ValidationError('labels は string 配列で指定する');
    payload.labels.forEach((label) => {
      if (typeof label !== 'string' || !label.trim()) {
        throw new ValidationError('labels には空文字や非文字列を指定できない');
      }
    });
  }
  if (payload.assignees !== undefined) {
    if (!Array.isArray(payload.assignees)) throw new ValidationError('assignees は string 配列で指定する');
    payload.assignees.forEach((assignee) => {
      if (typeof assignee !== 'string' || !assignee.trim()) {
        throw new ValidationError('assignees には空文字や非文字列を指定できない');
      }
    });
  }
};

const _normalizeStringArray = (values: string[] | undefined): string[] | undefined => {
  if (!values) return undefined;
  const normalized = values.map((value) => value.trim()).filter((value) => value.length > 0);
  if (normalized.length === 0) return undefined;
  return Array.from(new Set(normalized));
};
