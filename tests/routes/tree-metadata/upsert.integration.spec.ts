import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClaimValidationError } from '@/errors/claimValidationError';
import { INTERNAL_ERROR_MESSAGE } from '@/helpers/httpErrorMessageHelper';
import app from '@/index';
import { JwtVerificationService } from '@/services/jwtVerificationService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { AppEnv } from '@/types/env';

const mockVerifyGithubActionsIdToken = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/services/jwtVerificationService', () => ({
  JwtVerificationService: vi.fn().mockImplementation(() => ({
    verifyGithubActionsIdToken: mockVerifyGithubActionsIdToken,
  })),
}));

vi.mock('@/services/treePathUpdatedAtService', () => ({
  TreePathUpdatedAtService: vi.fn().mockImplementation(() => ({
    upsert: mockUpsert,
  })),
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
  TREE_METADATA_DB: {} as D1Database,
  JWT_REPLAY_DB: {} as D1Database,
});

describe('POST /tree-metadata/upsert', () => {
  const mockedJwtVerificationService = vi.mocked(JwtVerificationService);
  const mockedTreePathUpdatedAtService = vi.mocked(TreePathUpdatedAtService);

  beforeEach(() => {
    mockVerifyGithubActionsIdToken.mockReset();
    mockUpsert.mockReset();
    mockedJwtVerificationService.mockClear();
    mockedTreePathUpdatedAtService.mockClear();
  });

  it('成功時に 200 を返す', async () => {
    const env = createEnv();
    const now = Date.now();
    const requestBody = [
      {
        path: 'DCSWorld/Mods/aircraft/A-10C/entry.lua',
        updatedAt: now,
      },
    ];
    mockVerifyGithubActionsIdToken.mockResolvedValueOnce({
      payload: {},
      header: {},
    });
    mockUpsert.mockResolvedValueOnce(undefined);

    const response = await app.fetch(
      new Request('http://localhost/tree-metadata/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test.jwt.token',
        },
        body: JSON.stringify(requestBody),
      }),
      env,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: null,
    });

    expect(mockedJwtVerificationService).toHaveBeenCalledTimes(1);
    expect(mockedTreePathUpdatedAtService).toHaveBeenCalledTimes(1);
    expect(mockVerifyGithubActionsIdToken).toHaveBeenCalledTimes(1);
    const [token, audience, expectedClaims] = mockVerifyGithubActionsIdToken.mock.calls[0] ?? [];
    expect(token).toBe('test.jwt.token');
    expect(audience).toBe('tree-metadata');
    expect(expectedClaims).toEqual({
      sub: `repo:${env.TARGET_GH_OWNER}/${env.TARGET_GH_REPO}:pull_request`,
      repository: `${env.TARGET_GH_OWNER}/${env.TARGET_GH_REPO}`,
      repository_owner: env.TARGET_GH_OWNER,
      ref: `refs/heads/${env.TARGET_GH_DEFAULT_BRANCH}`,
      job_workflow_ref: `${env.TARGET_GH_OWNER}/${env.TARGET_GH_REPO}/.github/workflows/tree-metadata-sender.yml@refs/heads/${env.TARGET_GH_DEFAULT_BRANCH}`,
      workflow_ref: `${env.TARGET_GH_OWNER}/${env.TARGET_GH_REPO}/.github/workflows/tree-metadata-sender.yml@refs/heads/${env.TARGET_GH_DEFAULT_BRANCH}`,
    });
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(requestBody);
  });

  it('Authorization ヘッダがない場合は 401 を返す', async () => {
    const env = createEnv();

    const response = await app.fetch(
      new Request('http://localhost/tree-metadata/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([]),
      }),
      env,
    );

    expect(response.status).toBe(401);
    expect(mockVerifyGithubActionsIdToken).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('Authorization ヘッダがBearer形式ではない場合は 401 を返す', async () => {
    const env = createEnv();

    const response = await app.fetch(
      new Request('http://localhost/tree-metadata/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic test.jwt.token',
        },
        body: JSON.stringify([]),
      }),
      env,
    );

    expect(response.status).toBe(401);
    expect(mockVerifyGithubActionsIdToken).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('Bearer トークンの検証に失敗した場合は 401 を返す', async () => {
    const env = createEnv();
    mockVerifyGithubActionsIdToken.mockRejectedValueOnce(new Error('invalid token'));

    const response = await app.fetch(
      new Request('http://localhost/tree-metadata/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test.jwt.token',
        },
        body: JSON.stringify([]),
      }),
      env,
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      data: null,
      message: 'Authorization ヘッダに有効な Bearer 形式の JWS(JWT) を指定してください。',
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('Bearer トークンが権限不足の場合は 403 を返す', async () => {
    const env = createEnv();
    mockVerifyGithubActionsIdToken.mockRejectedValueOnce(new ClaimValidationError('sub', 'expected', 'actual'));

    const response = await app.fetch(
      new Request('http://localhost/tree-metadata/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test.jwt.token',
        },
        body: JSON.stringify([]),
      }),
      env,
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      data: null,
      message: '権限がありません。',
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('D1 の設定がない場合は 500 を返す', async () => {
    const env = createEnv();
    env.TREE_METADATA_DB = undefined;
    mockVerifyGithubActionsIdToken.mockResolvedValueOnce({
      payload: {},
      header: {},
    });

    const response = await app.fetch(
      new Request('http://localhost/tree-metadata/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test.jwt.token',
        },
        body: JSON.stringify([]),
      }),
      env,
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      data: null,
      message: INTERNAL_ERROR_MESSAGE,
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
