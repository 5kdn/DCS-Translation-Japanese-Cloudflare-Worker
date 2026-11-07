/**
 * v2読み取り6操作の成功・失敗応答を、実際のWorkerルーティングとOASで検証する。
 * GitHubとメタデータDBだけを置き換え、cursor・日時・スナップショット上限は実装を通す。
 * @packageDocumentation
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '@/index';
import { createTestBindings } from '../../helpers/environment';
import { expectV2Contract } from '../../helpers/v2Contract';

/** GitHubとメタデータDBの応答を、各テストから制御するためのモック。 */
const mocks = vi.hoisted(() => ({
  issues: vi.fn(),
  issue: vi.fn(),
  prs: vi.fn(),
  pr: vi.fn(),
  branch: vi.fn(),
  tree: vi.fn(),
  metadata: vi.fn(),
}));
vi.mock('octokit', () => ({
  App: class {
    /** 実際の認証・通信を行わず、操作別に制御できるGitHubクライアントを返す。 */
    async getInstallationOctokit() {
      return {
        rest: {
          issues: { listForRepo: mocks.issues, get: mocks.issue },
          pulls: { list: mocks.prs, get: mocks.pr },
          repos: { getBranch: mocks.branch },
          git: { getTree: mocks.tree },
        },
      };
    }
  },
}));
vi.mock('@/services/treePathUpdatedAtService', () => ({
  TreePathUpdatedAtService: class {
    read = mocks.metadata;
  },
}));
const sha = 'a'.repeat(40);
/**
 * GitHubのIssue応答fixtureを作り、ページ境界を番号と作成日時で調整できるようにする。
 * @param number Issue番号。
 * @param createdAt 作成日時と更新日時に使用するRFC 3339文字列。
 * @returns 公開応答への変換前のGitHub形式のIssue。
 */
const issue = (number = 1, createdAt = '2026-01-01T00:00:00Z') => ({
  number,
  title: `Issue ${number}`,
  body: null,
  state: 'open',
  html_url: `https://github.com/o/r/issues/${number}`,
  created_at: createdAt,
  updated_at: createdAt,
  closed_at: null,
});
/**
 * ブランチ情報を含む、未マージのGitHub PR応答fixtureを作る。
 * @param number PR番号。
 * @param createdAt 作成日時と更新日時に使用するRFC 3339文字列。
 * @returns GitHub形式のPR。
 */
const pr = (number = 1, createdAt = '2026-01-01T00:00:00Z') => ({
  ...issue(number, createdAt),
  draft: false,
  merged_at: null,
  head: { ref: 'feature', sha },
  base: { ref: 'master' },
});
/**
 * ツリーの件数・パス順序・JSONサイズを調整するためのblob fixtureを作る。
 * @param path リポジトリ相対のファイルパス。
 * @returns 固定のSHA・サイズ・modeを持つGitHubのツリー項目。
 */
const blob = (path = 'DCSWorld/a.lua') => ({ path, type: 'blob', mode: '100644', sha, size: 12 });
/**
 * 認証情報や送信元IPを要求せず、正式ホストのv2ルートへリクエストを渡す。
 * @param path /v2に続くパスと任意のクエリ文字列。
 * @param init メソッド・ヘッダーなど、テスト固有のリクエスト設定。
 * @returns テスト用バインディングで処理したWorkerの実応答。
 */
const request = (path: string, init?: RequestInit) =>
  worker.fetch(
    new Request(`https://api.dcs-translation-japanese.workers.dev/v2${path}`, init),
    createTestBindings({ TREE_METADATA_DB: {} as D1Database }),
  );
/** 共通の公開性・エラー形式を検証する読み取りパスと操作IDの対応。 */
const operations = [
  ['/issues', 'listIssues'],
  ['/issues/1', 'getIssue'],
  ['/prs', 'listPullRequests'],
  ['/prs/1', 'getPullRequest'],
  ['/tree', 'getTree'],
  ['/files?path=DCSWorld/a.lua', 'getFiles'],
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.issues.mockResolvedValue({ data: [issue()] });
  mocks.issue.mockResolvedValue({ data: issue() });
  mocks.prs.mockResolvedValue({ data: [pr()] });
  mocks.pr.mockResolvedValue({ data: pr() });
  mocks.branch.mockResolvedValue({ data: { commit: { sha } } });
  mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [blob()] } });
  mocks.metadata.mockResolvedValue({ 'DCSWorld/a.lua': new Date('2026-01-01T01:02:03.004Z') });
});

describe('v2 read contracts', () => {
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
    expect(unsupported.headers.get('Allow')).toBe('GET, HEAD');
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

  it('does not return a PR from the Issue detail operation', async () => {
    mocks.issue.mockResolvedValue({ data: { ...issue(), pull_request: {} } });
    const response = await request('/issues/1');
    expect(response.status).toBe(404);
    await expectV2Contract(response, 'getIssue');
  });

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

describe('tree and file snapshots', () => {
  it('pins tree, raw URLs and metadata to a commit and sorts paths by UTF-8 bytes', async () => {
    const paths = ['UserMissions/z.lua', 'DCSWorld/𐀀.lua', 'DCSWorld/\ue000.lua', 'DCSWorld/a.lua'];
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [...paths.map((path) => blob(path)), blob('README.md')] } });
    const response = await request('/tree');
    const body = await expectV2Contract(response, 'getTree');
    expect(body).toMatchObject({
      commitSha: sha,
      items: [
        { path: paths[3], updatedAt: '2026-01-01T01:02:03.004Z' },
        { path: paths[2], updatedAt: null },
        { path: paths[1], updatedAt: null },
        { path: paths[0], updatedAt: null },
      ],
    });
    expect(mocks.tree).toHaveBeenCalledWith(expect.objectContaining({ tree_sha: sha, recursive: 'true' }));
    expect(JSON.stringify(body)).toContain(`raw.githubusercontent.com/test-owner/test-repo/${sha}/`);
  });

  it('returns requested file order and commit-pinned encoded URLs, never ZIP or file content', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [blob('DCSWorld/a #?.lua'), blob('UserMissions/b.lua')] } });
    const response = await request('/files?path=UserMissions/b.lua&path=DCSWorld/a%20%23%3F.lua');
    expect(await expectV2Contract(response, 'getFiles')).toMatchObject({
      commitSha: sha,
      files: [
        { path: 'UserMissions/b.lua', updatedAt: null },
        {
          path: 'DCSWorld/a #?.lua',
          url: `https://raw.githubusercontent.com/test-owner/test-repo/${sha}/DCSWorld/a%20%23%3F.lua`,
        },
      ],
    });
    expect(response.headers.get('Content-Disposition')).toBeNull();
  });

  it('returns 404 for the entire file request when any file is missing or is a directory', async () => {
    mocks.tree.mockResolvedValue({
      data: { truncated: false, tree: [blob(), { ...blob('DCSWorld/directory'), type: 'tree', mode: '040000' }] },
    });
    for (const path of ['DCSWorld/missing.lua', 'DCSWorld/directory']) {
      const response = await request(`/files?path=DCSWorld/a.lua&path=${path}`);
      expect(response.status).toBe(404);
      await expectV2Contract(response, 'getFiles');
    }
  });

  it('rejects truncated GitHub trees instead of returning partial snapshots', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: true, tree: [blob()] } });
    for (const path of ['/tree', '/files?path=DCSWorld/a.lua']) {
      const response = await request(path);
      expect(response.status).toBe(502);
      await expectV2Contract(response);
    }
  });

  it('checks the 100,000 item boundary before loading metadata and applies the byte limit independently', async () => {
    const tree = Array.from({ length: 100000 }, (_, i) => blob(`DCSWorld/${i}`));
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree } });
    // このfixtureは件数上限内でも20 MiBを超えるため、メタデータ取得後に拒否される。
    expect((await request('/tree')).status).toBe(422);
    expect(mocks.metadata).toHaveBeenCalledOnce();
    mocks.metadata.mockClear();
    tree.push(blob('DCSWorld/100000'));
    const response = await request('/tree');
    expect(response.status).toBe(422);
    expect(await expectV2Contract(response, 'getTree')).toMatchObject({ code: 'SNAPSHOT_LIMIT_EXCEEDED' });
    expect(mocks.metadata).not.toHaveBeenCalled();
  });

  it('rejects JSON responses over 20 MiB measured in UTF-8 bytes', async () => {
    const tree = Array.from({ length: 7000 }, (_, i) => blob(`DCSWorld/${'あ'.repeat(1000)}${i}`));
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree } });
    const response = await request('/tree');
    expect(response.status).toBe(422);
    expect(await expectV2Contract(response, 'getTree')).toMatchObject({ code: 'SNAPSHOT_LIMIT_EXCEEDED' });
  });

  it('accepts exactly 20 MiB of serialized JSON and rejects one additional byte', async () => {
    const limit = 20971520;
    const tree = Array.from({ length: 6000 }, (_, i) => blob(`DCSWorld/${i}/a`));
    const snapshot = {
      commitSha: sha,
      generatedAt: '2026-01-01T00:00:00.000Z',
      items: tree.map((item) => ({
        ...item,
        url: `https://raw.githubusercontent.com/test-owner/test-repo/${sha}/${item.path}`,
        updatedAt: null,
      })),
    };
    let size = new TextEncoder().encode(JSON.stringify(snapshot)).length;
    if ((limit - size) % 2 !== 0 && tree[0]) {
      tree[0].size = 1;
      size--;
    }
    let padding = (limit - size) / 2;
    for (const item of tree) {
      const count = Math.min(4096 - item.path.length, padding);
      item.path += 'a'.repeat(count);
      padding -= count;
    }
    expect(padding).toBe(0);
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree } });
    const response = await request('/tree');
    expect(response.status).toBe(200);
    expect(new TextEncoder().encode(await response.text()).length).toBe(limit);
    const first = tree[0];
    if (!first) throw new Error('Missing fixture');
    first.size = first.size === 1 ? 12 : 123;
    const over = await request('/tree');
    expect(over.status).toBe(422);
    expect(await expectV2Contract(over, 'getTree')).toMatchObject({ code: 'SNAPSHOT_LIMIT_EXCEEDED' });
  });

  it('returns 503 with Retry-After if metadata storage is unavailable', async () => {
    mocks.metadata.mockRejectedValue(new Error('database secret'));
    const response = await request('/tree');
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBeTruthy();
    await expectV2Contract(response, 'getTree');
  });
});
