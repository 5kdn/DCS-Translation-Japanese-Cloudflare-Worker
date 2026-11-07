/**
 * tree取得のコミット固定・UTF-8順序・全体サイズ上限・依存先障害を実ルートで検証する。
 * GitHubとメタデータDBの応答だけをモックし、公開応答は契約スキーマへ照合する。
 * @packageDocumentation
 */
import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { blob, mocks, request, sha } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

/** ページ分割の前に全体を検証し、不完全なツリーを成功扱いしないことを確認する。 */
describe('GET /v2/tree', () => {
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

  it('rejects a truncated GitHub tree without caching it or loading metadata', async () => {
    mocks.tree.mockResolvedValueOnce({ data: { truncated: true, tree: [blob()] } });
    const response = await request('/tree');
    expect(response.status).toBe(502);
    await expectV2Contract(response, 'getTree');
    expect(mocks.metadata).not.toHaveBeenCalled();
    expect((await request('/tree')).status).toBe(200);
    expect(mocks.tree).toHaveBeenCalledTimes(2);
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
    const body = (await response.json()) as { items: unknown[]; page: { nextCursor: string | null } };
    expect(body.items.length).toBeLessThan(tree.length);
    expect(body.page.nextCursor).toBeTruthy();
    const first = tree[0];
    if (!first) throw new Error('Missing fixture');
    first.size = first.size === 1 ? 12 : 123;
    await (await caches.open('v2-tree')).delete(
      `https://api.dcs-translation-japanese.workers.dev/__tree-cache/v1/test-owner/test-repo/tree/${sha}`,
    );
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
