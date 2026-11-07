import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../helpers/v2Contract';
import { mocks, operations, request } from '../../../../helpers/v2Write';

vi.mock('octokit', async () => (await import('../../../../helpers/v2WriteMocks')).octokitMock);

describe('shared write route contracts', () => {
  it.each(operations)('%s %s writes without login', async (method, path, body, operation, status) => {
    const response = await request(method, path, body, undefined, { Authorization: 'Bearer invalid' });
    expect(response.status).toBe(status);
    await expectV2Contract(response, operation);
  });

  it.each([
    ['DELETE', '/issues/1'],
    ['PUT', '/issues/1'],
    ['POST', '/issues/1/lock'],
    ['PATCH', '/prs/1'],
    ['DELETE', '/prs/1'],
  ] as const)('does not offer %s %s', async (method, path) => {
    const response = await request(method, path, {});
    expect([404, 405]).toContain(response.status);
    expect(mocks.updateIssue).not.toHaveBeenCalled();
    expect(mocks.updateRef).not.toHaveBeenCalled();
  });

  it.each(operations)('%s %s hides upstream failures', async (method, path, body, operation) => {
    for (const mock of [mocks.createIssue, mocks.getIssue, mocks.getRef])
      mock.mockRejectedValue({ status: 500, message: 'private upstream data' });
    const response = await request(method, path, body);
    expect(response.status).toBe(502);
    expect(JSON.stringify(await expectV2Contract(response, operation))).not.toContain('private upstream data');
  });
});
