import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../helpers/v2Contract';
import { issue, mocks, request } from '../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../helpers/v2Read')).metadataMock);

describe('cursor validation', () => {
  it('rejects malformed, altered, expired and condition-mismatched cursors', async () => {
    mocks.issues.mockResolvedValue({ data: [issue(2), issue(1)] });
    const start = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start);
    try {
      const body = await (await request('/issues?limit=1')).json<{ page: { nextCursor: string } }>();
      const cursor = encodeURIComponent(body.page.nextCursor);
      for (const path of [
        '/issues?cursor=invalid',
        '/issues?cursor=',
        `/issues?cursor=${'a'.repeat(2049)}`,
        `/issues?limit=1&cursor=${cursor}x`,
        `/issues?limit=2&cursor=${cursor}`,
        `/issues?state=closed&limit=1&cursor=${cursor}`,
        `/prs?limit=1&cursor=${cursor}`,
      ]) {
        const response = await request(path);
        expect(response.status).toBe(400);
        expect(await expectV2Contract(response)).toMatchObject({ code: 'INVALID_CURSOR' });
      }
      clock.mockReturnValue(start + 24 * 60 * 60 * 1000);
      const expired = await request(`/issues?limit=1&cursor=${cursor}`);
      expect(expired.status).toBe(400);
      expect(await expectV2Contract(expired)).toMatchObject({ code: 'INVALID_CURSOR' });
    } finally {
      clock.mockRestore();
    }
  });
});
