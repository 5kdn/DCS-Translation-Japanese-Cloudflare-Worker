import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERNAL_ERROR_MESSAGE } from '@/helpers/httpErrorMessageHelper';
import app from '@/index';
import { getFilteredTreeItems } from '@/services/githubService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { ApiResponseBase, TreeItem } from '@/types/api';
import type { AppEnv } from '@/types/env';

vi.mock('@/services/githubService', () => ({
  getFilteredTreeItems: vi.fn(),
}));

const mockReadUpdatedAt = vi.fn();

vi.mock('@/services/treePathUpdatedAtService', () => ({
  TreePathUpdatedAtService: vi.fn(
    class MockTreePathUpdatedAtService {
      read = mockReadUpdatedAt;
    },
  ),
}));

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'test-branch',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
  TARGET_GH_APP_ID: '123456',
  TARGET_GH_APP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxxxxxxxxxxxxxxxxxxxxxxxxx\n-----END PRIVATE KEY-----',
  TARGET_GH_INSTALLATION_ID: '987654321',
  TREE_METADATA_DB: {} as D1Database,
});

describe('GET /tree', () => {
  const mockedGetFilteredTreeItems = vi.mocked(getFilteredTreeItems);
  const mockedTreePathUpdatedAtService = vi.mocked(TreePathUpdatedAtService);

  beforeEach(() => {
    mockedGetFilteredTreeItems.mockReset();
    mockedTreePathUpdatedAtService.mockClear();
    mockReadUpdatedAt.mockReset();
  });

  it('成功時にツリー情報を返す', async () => {
    const env = createEnv();
    const treeItems: TreeItem[] = [
      {
        path: 'DCSWorld/Mods/aircraft/A-10C/entry.lua',
        mode: '100644',
        type: 'blob',
        sha: 'abc123',
        size: 1024,
        url: 'https://example.com/blob1',
      },
      {
        path: 'DCSWorld/Mods/tech/CombinedArms/entry.lua',
        mode: '100644',
        type: 'blob',
        sha: 'def456',
        size: 2048,
        url: 'https://example.com/blob2',
      },
    ];
    mockedGetFilteredTreeItems.mockResolvedValueOnce(treeItems);
    const updatedAtMap = {
      'DCSWorld/Mods/aircraft/A-10C/entry.lua': new Date('2024-01-02T03:04:05.000Z'),
      'DCSWorld/Mods/tech/CombinedArms/entry.lua': null,
    };
    mockReadUpdatedAt.mockResolvedValueOnce(updatedAtMap);

    const response = await app.fetch(new Request('http://localhost/tree', { method: 'GET' }), env);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: [
        {
          ...treeItems[0],
          updatedAt: updatedAtMap['DCSWorld/Mods/aircraft/A-10C/entry.lua']?.toISOString(),
        },
        {
          ...treeItems[1],
          updatedAt: null,
        },
      ],
    });
    expect(mockedGetFilteredTreeItems).toHaveBeenCalledTimes(1);
    expect(mockedTreePathUpdatedAtService).toHaveBeenCalledTimes(1);
    expect(mockReadUpdatedAt).toHaveBeenCalledTimes(1);
    const ctx = mockedGetFilteredTreeItems.mock.calls[0]?.[0];
    expect(ctx?.owner).toBe(env.TARGET_GH_OWNER);
    expect(ctx?.repo).toBe(env.TARGET_GH_REPO);
    expect(ctx?.defaultBranch).toBe(env.TARGET_GH_DEFAULT_BRANCH.trim());
    expect(ctx?.octokit).toBeDefined();
  });

  it('失敗時にエラーレスポンスを返す', async () => {
    const env = createEnv();
    mockedGetFilteredTreeItems.mockRejectedValueOnce(new Error('unexpected failure'));

    const response = await app.fetch(new Request('http://localhost/tree', { method: 'GET' }), env);
    expect(response.status).toBe(500);
    const body = await response.json<ApiResponseBase<null>>();
    expect(body.success).toBe(false);
    expect(body.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(mockedGetFilteredTreeItems).toHaveBeenCalledTimes(1);
    expect(mockedTreePathUpdatedAtService).not.toHaveBeenCalled();
    expect(mockReadUpdatedAt).not.toHaveBeenCalled();
  });
});
