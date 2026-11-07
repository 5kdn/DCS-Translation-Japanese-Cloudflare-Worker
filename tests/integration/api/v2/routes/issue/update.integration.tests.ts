import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { issue, mocks, request } from '../../../../../helpers/v2Write';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2WriteMocks')).octokitMock);

describe('PATCH /v2/issues/{number}', () => {
  it('edits directly-created and closed issues without changing metadata', async () => {
    mocks.getIssue.mockResolvedValue({ data: { ...issue, state: 'closed', user: { login: 'someone-else' } } });
    const response = await request('PATCH', '/issues/1', { body: '' });
    expect(response.status).toBe(200);
    expect(mocks.updateIssue).toHaveBeenCalledWith({ owner: 'test-owner', repo: 'test-repo', issue_number: 1, body: '' });
  });

  it.each(['labels', 'assignees', 'state', 'state_reason', 'locked'])('rejects editing %s', async (key) => {
    const response = await request('PATCH', '/issues/1', { title: 'Title', [key]: 'invalid' });
    expect(response.status).toBe(400);
    await expectV2Contract(response, 'updateIssue');
    expect(mocks.updateIssue).not.toHaveBeenCalled();
  });

  it('never edits a PR through the issue endpoint', async () => {
    mocks.getIssue.mockResolvedValue({ data: { ...issue, pull_request: { url: 'https://github.com/o/r/pull/1' } } });
    const response = await request('PATCH', '/issues/1', { title: 'Title' });
    expect(response.status).toBe(404);
    await expectV2Contract(response, 'updateIssue');
    expect(mocks.updateIssue).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: 404 }, 404],
    [{ status: 422 }, 422],
    [{ status: 409 }, 409],
    [{ status: 403 }, 403],
    [{ status: 429, response: { headers: { 'retry-after': '12' } } }, 503],
  ] as const)('maps issue edit failures %j to %s', async (error, status) => {
    mocks.getIssue.mockRejectedValue(error);
    const response = await request('PATCH', '/issues/1', { title: 'Title' });
    expect(response.status).toBe(status);
    await expectV2Contract(response, 'updateIssue');
    if (status === 503) expect(response.headers.get('Retry-After')).toBe('12');
    expect(mocks.updateIssue).not.toHaveBeenCalled();
  });
});
