import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERNAL_ERROR_MESSAGE } from '@/helpers/httpErrorMessageHelper';
import app from '@/index';
import { createPullRequest } from '@/services/githubService';
import type { AppEnv } from '@/types/env';

vi.mock('@/services/githubService', () => ({
  createPullRequest: vi.fn(),
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

describe('POST /create-pr', () => {
  const mockedCreatePullRequest = vi.mocked(createPullRequest);

  beforeEach(() => {
    mockedCreatePullRequest.mockReset();
  });

  it('成功時にPR情報を返す', async () => {
    const env = createEnv();
    const requestBody = {
      prTitle: 'feat: add new module',
      prBody: '詳細説明',
      branchName: 'feature/new-module',
      commitMessage: 'feat: add files',
      files: [
        { path: 'README.md', content: '# README', operation: 'upsert' as const },
        { path: 'old.txt', operation: 'delete' as const },
      ],
    };
    const prResult = {
      prNumber: 42,
      prUrl: 'https://github.com/test-owner/test-repo/pull/42',
      branchName: requestBody.branchName,
      commitSha: 'abc123',
      note: 'existing pull request' as const,
    };
    mockedCreatePullRequest.mockResolvedValueOnce(prResult);

    const response = await app.fetch(
      new Request('http://localhost/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreatePullRequest).toHaveBeenCalledTimes(1);
    const [payload, ctx] = mockedCreatePullRequest.mock.calls[0] ?? [];
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
          prNumber: prResult.prNumber,
          prUrl: prResult.prUrl,
          branchName: prResult.branchName,
          commitSha: prResult.commitSha,
          note: prResult.note,
        },
      ],
    });
  });

  it('失敗時にエラーレスポンスを返す', async () => {
    const env = createEnv();
    const requestBody = {
      prTitle: 'fix: bad payload',
      branchName: 'fix/bad',
      files: [{ path: 'README.md', content: '# README' }],
    };
    mockedCreatePullRequest.mockResolvedValueOnce({
      error: 'validation error',
      detail: 'payload invalid',
    });

    const response = await app.fetch(
      new Request('http://localhost/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(mockedCreatePullRequest).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    const body = await response.json<{
      success: false;
      message: string;
    }>();
    expect(body.success).toBe(false);
    expect(body.message).toBe(INTERNAL_ERROR_MESSAGE);
  });
});
