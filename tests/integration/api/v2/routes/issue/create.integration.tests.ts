import { describe, expect, it, vi } from 'vitest';
import { mocks, request } from '../../../../../helpers/v2Write';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2WriteMocks')).octokitMock);

describe('POST /v2/issues', () => {
  it('creates issues with configured repository, labels and assignees', async () => {
    const response = await request('POST', '/issues', { title: 'Title', labels: ['bug'], assignees: ['user'] });
    expect(response.status).toBe(201);
    expect(mocks.createIssue).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      title: 'Title',
      labels: ['bug'],
      assignees: ['user'],
    });
  });
});
