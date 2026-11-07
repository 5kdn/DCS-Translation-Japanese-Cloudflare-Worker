import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../helpers/v2Contract';
import { issue, mocks, pr, request } from '../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../helpers/v2Read')).metadataMock);

describe('Issue/PR keyset pagination', () => {
  it.each([
    ['/issues', mocks.issues, issue, 'listIssues'],
    ['/prs', mocks.prs, pr, 'listPullRequests'],
  ] as const)(
    '%s uses descending creation time and number, even for ties across GitHub pages',
    async (path, mock, item, operation) => {
      const first = Array.from({ length: 100 }, (_, i) => item(i + 1));
      mock.mockImplementation(async ({ page }: { page: number }) => ({ data: page === 1 ? first : [item(101)] }));
      const response = await request(`${path}?limit=2&state=all`);
      const body = (await expectV2Contract(response, operation)) as {
        items: { number: number }[];
        page: { nextCursor: string };
      };
      expect(body.items.map((entry) => entry.number)).toEqual([101, 100]);
      expect(body.page.nextCursor).toBeTruthy();
      const next = await request(`${path}?limit=2&state=all&cursor=${encodeURIComponent(body.page.nextCursor)}`);
      expect(await expectV2Contract(next, operation)).toMatchObject({ items: [{ number: 99 }, { number: 98 }] });
      expect(mock).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'all', sort: 'created', direction: 'desc', per_page: 100 }),
      );
    },
  );
});
