import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { issue, mocks, request } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

describe('GET /v2/issues/{number}', () => {
  it('does not return a PR from the Issue detail operation', async () => {
    mocks.issue.mockResolvedValue({ data: { ...issue(), pull_request: {} } });
    const response = await request('/issues/1');
    expect(response.status).toBe(404);
    await expectV2Contract(response, 'getIssue');
  });
});
