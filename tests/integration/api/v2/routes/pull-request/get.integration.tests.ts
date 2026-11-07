import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { mocks, pr, request } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

describe('GET /v2/prs/{number}', () => {
  it('normalizes every Issue/PR date to UTC milliseconds', async () => {
    mocks.pr.mockResolvedValue({
      data: {
        ...pr(1, '2026-01-01T09:00:00+09:00'),
        state: 'closed',
        closed_at: '2026-01-02T09:00:00+09:00',
        merged_at: '2026-01-02T09:00:00+09:00',
      },
    });
    const response = await request('/prs/1');
    expect(await expectV2Contract(response, 'getPullRequest')).toMatchObject({
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      closedAt: '2026-01-02T00:00:00.000Z',
      mergedAt: '2026-01-02T00:00:00.000Z',
      merged: true,
    });
  });
});
