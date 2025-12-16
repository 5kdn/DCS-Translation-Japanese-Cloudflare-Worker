import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserFacingError } from '@/errors/userFacingError';
import { INTERNAL_ERROR_MESSAGE } from '@/helpers/httpErrorMessageHelper';
import app from '@/index';
import { getIssues } from '@/services/githubService';
import type { AppEnv } from '@/types/env';

vi.mock('@/services/githubService', () => ({
  getIssues: vi.fn(),
}));

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'main',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
  TARGET_GH_SECRET: 'dummy',
  TARGET_GH_APP_ID: '123456',
  TARGET_GH_APP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxxxxxxxxxxxxxxxxxxxxxxxxx\n-----END PRIVATE KEY-----',
  TARGET_GH_INSTALLATION_ID: '987654321',
});

describe('POST /issue/list', () => {
  const mockedGetIssues = vi.mocked(getIssues);

  beforeEach(() => {
    mockedGetIssues.mockReset();
  });

  it('成功時に Issue 一覧を返す', async () => {
    const env = createEnv();
    const issueItems = [
      {
        issueNumber: 1,
        title: 'bug: unexpected behavior',
        body: '詳細説明',
        issueUrl: 'https://github.com/test-owner/test-repo/issues/1',
        state: 'open' as const,
        closedAt: null,
        updatedAt: '2025-01-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        labels: ['bug'],
        assignees: ['alice'],
      },
    ];
    mockedGetIssues.mockResolvedValueOnce(issueItems);

    const response = await app.request('http://localhost/issue/list?state=all', { method: 'POST' }, env);

    expect(mockedGetIssues).toHaveBeenCalledTimes(1);
    const [ctx, req] = mockedGetIssues.mock.calls[0] ?? [];
    expect(req).toEqual({ state: 'all' });
    expect(ctx?.owner).toBe(env.TARGET_GH_OWNER);
    expect(ctx?.repo).toBe(env.TARGET_GH_REPO);
    expect(ctx?.defaultBranch).toBe(env.TARGET_GH_DEFAULT_BRANCH.trim());
    expect(ctx?.octokit).toBeDefined();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: issueItems,
    });
  });

  it('GitHub 操作失敗時に 500 を返す', async () => {
    const env = createEnv();
    mockedGetIssues.mockResolvedValueOnce({
      error: 'failed to get issues',
      detail: 'unexpected',
    });

    const response = await app.request('http://localhost/issue/list', { method: 'POST' }, env);

    expect(mockedGetIssues).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe(INTERNAL_ERROR_MESSAGE);
  });

  it('UserFacingError を 404 として返す', async () => {
    const env = createEnv();
    mockedGetIssues.mockRejectedValueOnce(new UserFacingError('NOT_FOUND', 404, 'リポジトリが見つからない。'));

    const response = await app.request('http://localhost/issue/list', { method: 'POST' }, env);

    expect(mockedGetIssues).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe('リポジトリが見つからない。');
  });
});
