import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserFacingError } from '@/errors/userFacingError';
import { INTERNAL_ERROR_MESSAGE } from '@/helpers/httpErrorMessageHelper';
import app from '@/index';
import { createIssue } from '@/services/githubService';
import type { AppEnv } from '@/types/env';

vi.mock('@/services/githubService', () => ({
  createIssue: vi.fn(),
}));

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'main',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
  TARGET_GH_APP_ID: '123456',
  TARGET_GH_APP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxxxxxxxxxxxxxxxxxxxxxxxxx\n-----END PRIVATE KEY-----',
  TARGET_GH_INSTALLATION_ID: '987654321',
});

describe('POST /issue/create', () => {
  const mockedCreateIssue = vi.mocked(createIssue);

  beforeEach(() => {
    mockedCreateIssue.mockReset();
  });

  it('成功時に Issue 情報を返す', async () => {
    const env = createEnv();
    const requestBody = {
      title: 'bug: unexpected behavior',
      body: '詳細説明',
      labels: ['bug', 'high'],
      assignees: ['alice'],
    };
    const issueResult = {
      issueNumber: 99,
      issueUrl: 'https://github.com/test-owner/test-repo/issues/99',
    };
    mockedCreateIssue.mockResolvedValueOnce(issueResult);

    const response = await app.fetch(
      new Request('http://localhost/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreateIssue).toHaveBeenCalledTimes(1);
    const [payload, ctx] = mockedCreateIssue.mock.calls[0] ?? [];
    expect(payload).toEqual(requestBody);
    expect(ctx?.owner).toBe(env.TARGET_GH_OWNER);
    expect(ctx?.repo).toBe(env.TARGET_GH_REPO);
    expect(ctx?.defaultBranch).toBe(env.TARGET_GH_DEFAULT_BRANCH.trim());
    expect(ctx?.octokit).toBeDefined();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: [
        {
          issueNumber: issueResult.issueNumber,
          issueUrl: issueResult.issueUrl,
        },
      ],
    });
  });

  it('失敗時にエラーレスポンスを返す', async () => {
    const env = createEnv();
    const requestBody = {
      title: '',
    };
    mockedCreateIssue.mockResolvedValueOnce({
      error: 'validation error',
      detail: 'payload invalid',
    });

    const response = await app.fetch(
      new Request('http://localhost/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreateIssue).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe(INTERNAL_ERROR_MESSAGE);
  });

  it('リポジトリが存在しない場合は 404 を返す', async () => {
    const env = createEnv();
    const requestBody = {
      title: 'bug: repo missing',
    };
    mockedCreateIssue.mockRejectedValueOnce(new UserFacingError('NOT_FOUND', 404, 'リポジトリが見つからない。'));

    const response = await app.fetch(
      new Request('http://localhost/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreateIssue).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe('リポジトリが見つからない。');
  });

  it('権限不足の場合は 403 を返す', async () => {
    const env = createEnv();
    const requestBody = {
      title: 'bug: forbidden',
    };
    mockedCreateIssue.mockRejectedValueOnce(new UserFacingError('FORBIDDEN', 403, 'Issue を作成する権限がない。'));

    const response = await app.fetch(
      new Request('http://localhost/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreateIssue).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(403);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Issue を作成する権限がない。');
  });

  it('処理不能の場合は 422 を返す', async () => {
    const env = createEnv();
    const requestBody = {
      title: 'bug: unprocessable',
    };
    mockedCreateIssue.mockRejectedValueOnce(new UserFacingError('UNPROCESSABLE_ENTITY', 422, '処理できないリクエストである。'));

    const response = await app.fetch(
      new Request('http://localhost/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreateIssue).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(422);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe('処理できないリクエストである。');
  });

  it('未知の例外の場合は 500 を返す', async () => {
    const env = createEnv();
    const requestBody = {
      title: 'bug: unknown error',
    };
    mockedCreateIssue.mockRejectedValueOnce(new Error('boom'));

    const response = await app.fetch(
      new Request('http://localhost/issue/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreateIssue).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe(INTERNAL_ERROR_MESSAGE);
  });
});
