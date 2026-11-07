import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { issue, mocks, request } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

describe('GET /v2/issues', () => {
  it.each([
    [{ status: 500 }, 502],
    [{ status: 401 }, 502],
    [{ status: 403 }, 502],
    [{ status: 429, response: { headers: { 'retry-after': '12' } } }, 503],
    [{ status: 403, response: { headers: { 'x-ratelimit-remaining': '0' } } }, 503],
    [{ status: 403, message: 'secondary rate limit' }, 503],
    [{ status: 503 }, 503],
    [new TypeError('fetch failed: secret'), 503],
  ] as const)('maps upstream failures without leaking details: %j', async (error, status) => {
    mocks.issues.mockRejectedValue(error);
    const response = await request('/issues');
    expect(response.status).toBe(status);
    if (status === 503) expect(Number(response.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
    const body = await expectV2Contract(response, 'listIssues');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('stops once a full page and an older creation time establish the boundary', async () => {
    mocks.issues.mockResolvedValue({
      data: Array.from({ length: 100 }, (_, i) => issue(100 - i, new Date(Date.UTC(2026, 0, 1) - i * 1000).toISOString())),
    });
    const response = await request('/issues?limit=2');
    expect(await expectV2Contract(response, 'listIssues')).toMatchObject({ items: [{ number: 100 }, { number: 99 }] });
    expect(mocks.issues).toHaveBeenCalledOnce();
  });

  it('does not duplicate entries when GitHub pages overlap during a concurrent insertion', async () => {
    mocks.issues.mockImplementation(async ({ page }: { page: number }) => ({
      data: page === 1 ? Array.from({ length: 100 }, (_, i) => issue(i + 1)) : [issue(100), issue(101)],
    }));
    const body = await (await request('/issues?limit=100')).json<{ items: { number: number }[] }>();
    expect(body.items).toHaveLength(100);
    expect(new Set(body.items.map((item) => item.number)).size).toBe(100);
    expect(body.items[0]?.number).toBe(101);
  });

  it('fills Issue pages after excluding PRs and ends with a null cursor', async () => {
    mocks.issues.mockImplementation(async ({ page }: { page: number }) => ({
      data:
        page === 1
          ? Array.from({ length: 100 }, (_, i) => ({ ...issue(i + 10), pull_request: {} }))
          : [issue(3), issue(2), issue(1)],
    }));
    const first = await request('/issues?limit=2');
    const body = (await expectV2Contract(first, 'listIssues')) as { page: { nextCursor: string } };
    expect(body).toMatchObject({ items: [{ number: 3 }, { number: 2 }] });
    const last = await request(`/issues?limit=2&cursor=${encodeURIComponent(body.page.nextCursor)}`);
    expect(await expectV2Contract(last, 'listIssues')).toMatchObject({ items: [{ number: 1 }], page: { nextCursor: null } });
  });

  it('does not shift the boundary when a newer Issue is added', async () => {
    mocks.issues.mockResolvedValue({ data: [issue(3), issue(2), issue(1)] });
    const body = await (await request('/issues?limit=1')).json<{ page: { nextCursor: string } }>();
    mocks.issues.mockResolvedValue({ data: [issue(4, '2026-02-01T00:00:00Z'), issue(3), issue(2), issue(1)] });
    expect(
      await expectV2Contract(await request(`/issues?limit=1&cursor=${encodeURIComponent(body.page.nextCursor)}`), 'listIssues'),
    ).toMatchObject({ items: [{ number: 2 }] });
  });

  it('returns null for an empty page and applies defaults', async () => {
    mocks.issues.mockResolvedValue({ data: Array.from({ length: 21 }, (_, i) => issue(i + 1)) });
    const page = await (await request('/issues')).json<{ items: unknown[]; page: { nextCursor: string | null } }>();
    expect(page.items).toHaveLength(20);
    expect(page.page.nextCursor).toBeTruthy();
    mocks.issues.mockResolvedValue({ data: [] });
    expect(await expectV2Contract(await request('/issues'), 'listIssues')).toEqual({ items: [], page: { nextCursor: null } });
    expect(mocks.issues).toHaveBeenCalledWith(expect.objectContaining({ state: 'open' }));
  });
});
