import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserFacingError } from '@/errors/userFacingError';
import { createIssue } from '@/services/githubService/issues';
import type { IssuePayload } from '@/types/types';
import { ctxOf, makeOctokit } from './fixtures';

describe('createIssue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: タイトルをtrimし、ラベル・アサインを正規化してIssueを作成する', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockResolvedValue({
      data: { number: 7, html_url: 'https://example/issues/7' },
    });

    const payload: IssuePayload = {
      title: '  bug report  ',
      body: 'body',
      labels: [' bug ', 'feature', 'bug'],
      assignees: [' alice ', 'bob', 'alice'],
    };

    const result = await createIssue(payload, ctxOf(octokit));

    expect(result).toEqual({
      issueNumber: 7,
      issueUrl: 'https://example/issues/7',
    });
    expect(rest.issues.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'bug report',
      body: 'body',
      labels: ['bug', 'feature'],
      assignees: ['alice', 'bob'],
    });
  });

  it('バリデーションエラー: title 必須', async () => {
    const { octokit } = makeOctokit();
    const payload = { title: '   ' } as IssuePayload;

    const result = await createIssue(payload, ctxOf(octokit));

    expect(result).toEqual({
      error: 'validation error',
      detail: 'title は必須',
      code: 'VALIDATION_ERROR',
    });
  });

  it('バリデーションエラー: labels は配列で指定する', async () => {
    const { octokit } = makeOctokit();
    const payload = { title: 'bug', labels: 'bug' } as unknown as IssuePayload;

    const result = await createIssue(payload, ctxOf(octokit));

    expect(result).toMatchObject({ error: 'validation error', code: 'VALIDATION_ERROR' });
    expect((result as { detail: string }).detail).toContain('labels は string 配列で指定する');
  });

  it('Issue が無効化されている場合は UserFacingError を投げる', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockRejectedValue({ status: 410 });

    await expect(createIssue({ title: 'bug' }, ctxOf(octokit))).rejects.toBeInstanceOf(UserFacingError);
  });

  it('権限不足の場合は UserFacingError を投げる', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockRejectedValue({ status: 403 });

    await expect(createIssue({ title: 'bug' }, ctxOf(octokit))).rejects.toBeInstanceOf(UserFacingError);
  });

  it('リポジトリが見つからない場合は UserFacingError を投げる', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockRejectedValue({ status: 404 });

    await expect(createIssue({ title: 'bug' }, ctxOf(octokit))).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('未知のエラーは failure で返す', async () => {
    const { octokit, rest } = makeOctokit();
    const error = Object.assign(new Error('boom'), { status: 500 });
    rest.issues.create.mockRejectedValue(error);

    const result = await createIssue({ title: 'bug' }, ctxOf(octokit));

    expect(result).toEqual({
      error: 'failed to create issue',
      detail: 'boom',
    });
  });
});
