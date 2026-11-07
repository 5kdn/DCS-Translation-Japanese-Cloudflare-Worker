import { Octokit } from 'octokit';
import { describe, expect, it, vi } from 'vitest';
import { getIssues } from '@/services/githubService/issues';
import { ctxOf } from './fixtures';

const issue = (number: number) => ({
  number,
  title: `Issue ${number}`,
  body: null,
  html_url: `https://github.com/owner/repo/issues/${number}`,
  state: 'open',
  closed_at: null,
  updated_at: '2026-10-28T00:00:00Z',
  created_at: '2026-10-27T00:00:00Z',
  labels: ['bug', { name: 'help wanted' }],
  assignees: [{ login: 'alice' }],
});

const response = (data: unknown[], next?: string) =>
  new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
      ...(next ? { link: `<${next}>; rel="next"` } : {}),
    },
  });

const setup = () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  const octokit = new Octokit({ request: { fetch }, retry: { enabled: false }, throttle: { enabled: false } });
  return { fetch, ctx: ctxOf(octokit) };
};

describe('getIssues', () => {
  it.each(['open', 'closed', 'all'] as const)('%s: 全ページを取得し、ページ境界のPRを除外する', async (state) => {
    const { fetch, ctx } = setup();
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      ...issue(index + 1),
      state: state === 'closed' ? 'closed' : 'open',
      ...(index === 99 ? { pull_request: { url: 'https://api.github.com/repos/owner/repo/pulls/100' } } : {}),
    }));
    const next = `https://api.github.com/repos/owner/repo/issues?state=${state}&per_page=100&page=2`;
    fetch.mockResolvedValueOnce(response(firstPage, next)).mockResolvedValueOnce(
      response([
        { ...issue(101), pull_request: {} },
        { ...issue(102), state: firstPage[0]?.state },
      ]),
    );

    const result = await getIssues(ctx, { state });

    expect(result).toEqual([
      ...firstPage.slice(0, 99).map((entry) => ({
        issueNumber: entry.number,
        title: entry.title,
        body: entry.body,
        issueUrl: entry.html_url,
        state: entry.state,
        closedAt: entry.closed_at,
        updatedAt: entry.updated_at,
        createdAt: entry.created_at,
        labels: ['bug', 'help wanted'],
        assignees: ['alice'],
      })),
      {
        issueNumber: 102,
        title: 'Issue 102',
        body: null,
        issueUrl: issue(102).html_url,
        state: firstPage[0]?.state,
        closedAt: null,
        updatedAt: issue(102).updated_at,
        createdAt: issue(102).created_at,
        labels: ['bug', 'help wanted'],
        assignees: ['alice'],
      },
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
    const url = new URL(String(fetch.mock.calls[0]?.[0]));
    expect(Object.fromEntries(url.searchParams)).toEqual({ state, sort: 'updated', direction: 'desc', per_page: '100' });
    expect(String(fetch.mock.calls[1]?.[0])).toBe(next);
  });

  it('state省略時はopenで取得し、空の結果を返す', async () => {
    const { fetch, ctx } = setup();
    fetch.mockResolvedValueOnce(response([]));

    expect(await getIssues(ctx)).toEqual([]);
    expect(new URL(String(fetch.mock.calls[0]?.[0])).searchParams.get('state')).toBe('open');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('後続ページが失敗した場合は部分的な成功ではなく既存のエラーを返す', async () => {
    const { fetch, ctx } = setup();
    fetch
      .mockResolvedValueOnce(response([issue(1)], 'https://api.github.com/repos/owner/repo/issues?page=2'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'boom' }), { status: 500 }));

    expect(await getIssues(ctx)).toMatchObject({ error: 'failed to get issues', detail: expect.stringContaining('boom') });
  });
});
