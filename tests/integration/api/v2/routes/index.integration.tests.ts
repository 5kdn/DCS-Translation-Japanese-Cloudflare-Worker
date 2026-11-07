import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../helpers/v2Contract';
import { issue, mocks, request } from '../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../helpers/v2Read')).metadataMock);

const operations = [
  ['/issues', 'listIssues'],
  ['/issues/1', 'getIssue'],
  ['/prs', 'listPullRequests'],
  ['/prs/1', 'getPullRequest'],
  ['/tree', 'getTree'],
  ['/files?path=DCSWorld/a.lua', 'getFiles'],
] as const;

describe('v2 read route contracts', () => {
  it.each(operations)('%s is public, ignores authentication and has no write rate limit', async (path, operation) => {
    for (let i = 0; i < 11; i++) {
      const response = await request(path, { headers: { Authorization: 'Bearer invalid' } });
      expect(response.status).toBe(200);
      await expectV2Contract(response, operation);
    }
  });

  it.each(operations)('HEAD %s returns the same media type without a body', async (path) => {
    const response = await request(path, { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(await response.text()).toBe('');
  });

  it.each(operations)('%s rejects unacceptable media and unsupported methods', async (path, operation) => {
    const response = await request(path, { headers: { Accept: 'application/zip' } });
    expect(response.status).toBe(406);
    await expectV2Contract(response, operation);
    const unsupported = await request(path, { method: 'DELETE' });
    expect(unsupported.status).toBe(405);
    const allow =
      path === '/issues' || path === '/prs' ? 'GET, HEAD, POST' : path === '/issues/1' ? 'GET, HEAD, PATCH' : 'GET, HEAD';
    expect(unsupported.headers.get('Allow')).toBe(allow);
    await expectV2Contract(unsupported, operation);
  });

  it.each(operations)('%s returns a contract-valid error on GitHub failure', async (path, operation) => {
    for (const mock of [mocks.issues, mocks.issue, mocks.prs, mocks.pr, mocks.branch]) {
      mock.mockRejectedValue({ status: 500, message: 'private upstream details' });
    }
    const response = await request(path);
    expect(response.status).toBe(502);
    const body = await expectV2Contract(response, operation);
    expect(JSON.stringify(body)).not.toContain('private upstream details');
  });

  it.each([
    '/issues?limit=0',
    '/issues?limit=101',
    '/issues?state=invalid',
    '/issues?unknown=x',
    '/issues?limit=1&limit=2',
    '/prs?cursor=',
    '/prs?limit=1.5',
    '/prs?state=open&state=closed',
    '/issues/0',
    '/issues/not-a-number',
    '/prs/2147483648',
    '/issues/1?extra=x',
    '/tree?cursor=x',
    '/files',
    '/files?path=',
    '/files?path=DCSWorld/a.lua&path=DCSWorld/a.lua',
    '/files?path=/DCSWorld/a.lua',
    '/files?path=DCSWorld/../a.lua',
    '/files?path=DCSWorld/./a.lua',
    '/files?path=DCSWorld//a.lua',
    '/files?path=DCSWorld/.gitkeep',
    '/files?path=DCSWorld/a%5Cb.lua',
    '/files?path=DCSWorld/a%00.lua',
    '/files?path=DCSWorld/a%C2%85.lua',
    '/files?path=README.md',
    '/files?path=DCSWorld/a.lua&unknown=1',
    `/files?path=DCSWorld/${'a'.repeat(4088)}`,
    `/files?${Array.from({ length: 101 }, (_, i) => `path=DCSWorld/${i}`).join('&')}`,
    `/files?path=DCSWorld/${'あ'.repeat(1363)}`,
  ])('rejects invalid input %s', async (path) => {
    const response = await request(path);
    expect(response.status).toBe(path.includes('あ') ? 414 : 400);
    await expectV2Contract(response);
    expect(mocks.branch).not.toHaveBeenCalled();
  });

  it.each([
    ['/issues/1', mocks.issue],
    ['/prs/1', mocks.pr],
  ] as const)('%s maps a missing target to 404', async (path, mock) => {
    mock.mockRejectedValue({ status: 404 });
    const response = await request(path);
    expect(response.status).toBe(404);
    await expectV2Contract(response);
  });

  it('rejects malformed upstream data as 502', async () => {
    mocks.issue.mockResolvedValue({ data: { ...issue(), created_at: 'invalid' } });
    const response = await request('/issues/1');
    expect(response.status).toBe(502);
    await expectV2Contract(response, 'getIssue');
    mocks.branch.mockResolvedValue({ data: {} });
    const tree = await request('/tree');
    expect(tree.status).toBe(502);
    await expectV2Contract(tree, 'getTree');
  });
});
