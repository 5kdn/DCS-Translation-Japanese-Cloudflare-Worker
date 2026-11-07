/**
 * treeの継続取得と共有キャッシュを、実ルーティング・署名処理・Cache APIで検証する。
 * GitHubとメタデータDBをモックし、ブランチ更新・期限境界・キャッシュ障害を再現する。
 * @packageDocumentation
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { blob, mocks, request, sha } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

/** 取得途中のブランチ更新で新たに参照されるコミットSHA。 */
const otherSha = 'b'.repeat(40);
/** テスト用リポジトリの内部キャッシュキー。個別の消失・破損を再現するために使う。 */
const prefix = 'https://api.dcs-translation-japanese.workers.dev/__tree-cache/v1/test-owner/test-repo/';
/** 契約検証後の応答から、ページ間の一貫性と完了判定に使う項目を取り出す型。 */
type TreePage = { commitSha: string; items: { path: string }[]; page: { nextCursor: string | null } };
/**
 * treeルートへアクセスし、公開スキーマに照合したページを返す。
 * @param query 先頭の疑問符を含むクエリ文字列。省略時は既定条件で取得する。
 * @returns コミットSHA・項目一覧・継続情報を持つ、契約検証済みの応答。
 */
const page = async (query = ''): Promise<TreePage> =>
  (await expectV2Contract(await request(`/tree${query}`), 'getTree')) as TreePage;

/** 共通ヘルパーの初期化に加えて、ブランチ更新用コミットのキャッシュも消す。 */
beforeEach(async () => {
  await (await caches.open('v2-tree')).delete(`${prefix}tree/${otherSha}`);
});

/** 全ページ取得の一貫性・上限・期限と、キャッシュ利用時も維持すべき動作を確認する。 */
describe('tree pagination and shared cache', () => {
  it('keeps the original commit across branch updates and cache eviction without gaps or duplicates', async () => {
    const tree = ['DCSWorld/c.lua', 'DCSWorld/a.lua', 'DCSWorld/b.lua'].map((path) => blob(path));
    mocks.tree.mockImplementation(async ({ tree_sha }: { tree_sha: string }) => ({
      data: { truncated: false, tree: tree_sha === sha ? tree : [blob('DCSWorld/new.lua')] },
    }));
    const first = await page('?limit=2');
    expect(first.items.map((item) => item.path)).toEqual(['DCSWorld/a.lua', 'DCSWorld/b.lua']);
    expect(first.page.nextCursor).toBeTruthy();
    mocks.branch.mockResolvedValue({ data: { commit: { sha: otherSha } } });
    await (await caches.open('v2-tree')).delete(`${prefix}branch/main`);
    expect((await page()).commitSha).toBe(otherSha);
    await (await caches.open('v2-tree')).delete(`${prefix}tree/${sha}`);
    const last = await page(`?limit=2&cursor=${encodeURIComponent(first.page.nextCursor ?? '')}`);
    expect(last.commitSha).toBe(sha);
    expect([...first.items, ...last.items].map((item) => item.path)).toEqual([
      'DCSWorld/a.lua',
      'DCSWorld/b.lua',
      'DCSWorld/c.lua',
    ]);
    expect(last.page.nextCursor).toBeNull();
    expect(mocks.branch).toHaveBeenCalledTimes(2);
    expect(mocks.tree).toHaveBeenLastCalledWith(expect.objectContaining({ tree_sha: sha }));
  });

  it('shares the head for 60 seconds and immutable trees across requests while keeping metadata fresh', async () => {
    const now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const first = await page();
      clock.mockReturnValue(now + 59999);
      mocks.branch.mockResolvedValue({ data: { commit: { sha: otherSha } } });
      mocks.metadata.mockResolvedValue({ 'DCSWorld/a.lua': new Date('2026-02-01T00:00:00Z') });
      const warm = await page();
      expect(warm.commitSha).toBe(first.commitSha);
      expect(warm.items).toMatchObject([{ updatedAt: '2026-02-01T00:00:00.000Z' }]);
      expect(mocks.branch).toHaveBeenCalledOnce();
      expect(mocks.tree).toHaveBeenCalledOnce();
      clock.mockReturnValue(now + 60000);
      expect((await page()).commitSha).toBe(otherSha);
      expect(mocks.branch).toHaveBeenCalledTimes(2);
      expect(mocks.tree).toHaveBeenCalledTimes(2);
    } finally {
      clock.mockRestore();
    }
  });

  it('reuses the full GitHub tree for subsequent pages and independent clients', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: ['a', 'b', 'c'].map((s) => blob(`DCSWorld/${s}`)) } });
    const first = await page('?limit=1');
    await page(`?limit=1&cursor=${encodeURIComponent(first.page.nextCursor ?? '')}`);
    await page();
    expect(mocks.branch).toHaveBeenCalledOnce();
    expect(mocks.tree).toHaveBeenCalledOnce();
  });

  it('continues serving complete data when the cache is unavailable', async () => {
    const cache = vi.spyOn(caches, 'open').mockRejectedValue(new Error('cache unavailable'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect((await page()).items).toHaveLength(1);
      expect((await page()).items).toHaveLength(1);
      expect(mocks.branch).toHaveBeenCalledTimes(2);
      expect(mocks.tree).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalled();
    } finally {
      cache.mockRestore();
      warn.mockRestore();
    }
  });

  it('does not accept a truncated tree from cache', async () => {
    const cache = await caches.open('v2-tree');
    await cache.put(
      `${prefix}tree/${sha}`,
      Response.json(
        {
          expiresAt: Date.now() + 60000,
          value: { truncated: true, tree: [blob('DCSWorld/incomplete.lua')] },
        },
        { headers: { 'Cache-Control': 'public, max-age=60' } },
      ),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect((await page()).items).toMatchObject([{ path: 'DCSWorld/a.lua' }]);
      expect(mocks.tree).toHaveBeenCalledOnce();
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('does not extend cursor expiry when fetching another page', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: ['a', 'b', 'c'].map((s) => blob(`DCSWorld/${s}`)) } });
    const now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const first = await page('?limit=1');
      clock.mockReturnValue(now + 23 * 3600000);
      const second = await page(`?limit=1&cursor=${encodeURIComponent(first.page.nextCursor ?? '')}`);
      expect(second.page.nextCursor).toBeTruthy();
      clock.mockReturnValue(now + 24 * 3600000);
      const response = await request(`/tree?limit=1&cursor=${encodeURIComponent(second.page.nextCursor ?? '')}`);
      expect(response.status).toBe(400);
      expect(await expectV2Contract(response, 'getTree')).toMatchObject({ code: 'INVALID_CURSOR' });
    } finally {
      clock.mockRestore();
    }
  });

  it('returns an explicit final page for an empty tree', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [] } });
    expect(await page()).toMatchObject({ items: [], page: { nextCursor: null } });
  });

  it.each(['limit=0', 'limit=10001', 'limit=1.5', 'limit=abc', 'cursor=', 'cursor=invalid', 'unknown=1'])(
    'rejects invalid input: %s',
    async (query) => {
      const response = await request(`/tree?${query}`);
      expect(response.status).toBe(400);
      await expectV2Contract(response, 'getTree');
      expect(mocks.branch).not.toHaveBeenCalled();
      expect(mocks.tree).not.toHaveBeenCalled();
    },
  );

  it('rejects tampered, expired and different-limit cursors before upstream access', async () => {
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [blob('DCSWorld/a'), blob('DCSWorld/b')] } });
    const first = await page('?limit=1');
    const cursor = first.page.nextCursor ?? '';
    const count = mocks.tree.mock.calls.length;
    for (const query of [`limit=2&cursor=${cursor}`, `limit=1&cursor=x${cursor}`]) {
      const response = await request(`/tree?${query}`);
      expect(response.status).toBe(400);
      expect(await expectV2Contract(response, 'getTree')).toMatchObject({ code: 'INVALID_CURSOR' });
    }
    const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 86400000);
    try {
      const response = await request(`/tree?limit=1&cursor=${cursor}`);
      expect(response.status).toBe(400);
      expect(await expectV2Contract(response, 'getTree')).toMatchObject({ code: 'INVALID_CURSOR' });
    } finally {
      clock.mockRestore();
    }
    expect(mocks.tree).toHaveBeenCalledTimes(count);
  });

  it('accepts 10,000 files in one default page and rejects 10,001 before metadata access', async () => {
    const tree = Array.from({ length: 10000 }, (_, i) => blob(`DCSWorld/${String(i).padStart(5, '0')}.lua`));
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree } });
    const body = await page();
    expect(body.items).toHaveLength(10000);
    expect(body.page.nextCursor).toBeNull();
    await (await caches.open('v2-tree')).delete(`${prefix}tree/${sha}`);
    mocks.metadata.mockClear();
    tree.push(blob('DCSWorld/10000.lua'));
    const response = await request('/tree');
    expect(response.status).toBe(422);
    expect(await expectV2Contract(response, 'getTree')).toMatchObject({ code: 'SNAPSHOT_LIMIT_EXCEEDED' });
    expect(mocks.metadata).not.toHaveBeenCalled();
  });

  it('splits large JSON pages at 8 MiB without losing items', async () => {
    const tree = Array.from({ length: 3000 }, (_, i) => blob(`DCSWorld/${'あ'.repeat(300)}${i}.lua`));
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree } });
    const paths: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const response = await request(`/tree${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(8 * 1024 * 1024);
      const body: TreePage = JSON.parse(text);
      paths.push(...body.items.map((item) => item.path));
      cursor = body.page.nextCursor;
      pages++;
      expect(pages).toBeLessThan(10);
    } while (cursor);
    expect(new Set(paths).size).toBe(tree.length);
    expect(paths).toHaveLength(tree.length);
    expect(pages).toBeGreaterThan(1);
    expect(mocks.tree).toHaveBeenCalledOnce();
  });
});
