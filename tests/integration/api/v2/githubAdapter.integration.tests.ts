import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../helpers/v2Contract';
import { blob, mocks, request } from '../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../helpers/v2Read')).metadataMock);

describe('GitHub snapshot validation', () => {
  it('rejects truncated GitHub trees instead of returning partial snapshots', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: true, tree: [blob()] } });
    for (const path of ['/tree', '/files?path=DCSWorld/a.lua']) {
      const response = await request(path);
      expect(response.status).toBe(502);
      await expectV2Contract(response);
    }
  });
});
