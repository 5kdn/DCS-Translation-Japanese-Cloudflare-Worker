import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('POST /create-issue', () => {
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

    const response = await app.request(
      'http://localhost/create-issue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
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

    const response = await app.request(
      'http://localhost/create-issue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
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
