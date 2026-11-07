import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { blob, mocks, request, sha } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

describe('GET /v2/files', () => {
  it('returns requested file order and commit-pinned encoded URLs, never ZIP or file content', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [blob('DCSWorld/a #?.lua'), blob('UserMissions/b.lua')] } });
    const response = await request('/files?path=UserMissions/b.lua&path=DCSWorld/a%20%23%3F.lua');
    expect(await expectV2Contract(response, 'getFiles')).toMatchObject({
      commitSha: sha,
      files: [
        { path: 'UserMissions/b.lua', updatedAt: null },
        {
          path: 'DCSWorld/a #?.lua',
          url: `https://raw.githubusercontent.com/test-owner/test-repo/${sha}/DCSWorld/a%20%23%3F.lua`,
        },
      ],
    });
    expect(response.headers.get('Content-Disposition')).toBeNull();
  });

  it('returns 404 for the entire file request when any file is missing or is a directory', async () => {
    mocks.tree.mockResolvedValue({
      data: { truncated: false, tree: [blob(), { ...blob('DCSWorld/directory'), type: 'tree', mode: '040000' }] },
    });
    for (const path of ['DCSWorld/missing.lua', 'DCSWorld/directory']) {
      const response = await request(`/files?path=DCSWorld/a.lua&path=${path}`);
      expect(response.status).toBe(404);
      await expectV2Contract(response, 'getFiles');
    }
  });
});
