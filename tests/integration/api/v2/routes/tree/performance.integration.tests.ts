/**
 * 現在件数と想定最大件数で、tree全件取得のコールド・ウォーム性能を計測する。
 * 経過時間に合否の閾値を設けず、件数・取得回数・応答サイズ・キャッシュ再利用を検証する。
 * @packageDocumentation
 */
import { describe, expect, it, vi } from 'vitest';
import { blob, mocks, request } from '../../../../../helpers/v2Read';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2Read')).octokitMock);
vi.mock('@/services/treePathUpdatedAtService', async () => (await import('../../../../../helpers/v2Read')).metadataMock);

/** GitHub/D1の通信時間を除き、全件取得のCPU処理・Cache API・JSON転送を比較する。 */
describe('tree full-fetch measurements', () => {
  it.each([2542, 10000])('fetches %i representative files in one request, cold and warm', async (count) => {
    const tree = Array.from({ length: count }, (_, i) =>
      blob(`DCSWorld/Mods/aircraft/A-10A/Missions/Campaigns/A-10A Camp ${String(i).padStart(5, '0')}.miz/l10n/JP/dictionary`),
    );
    mocks.tree.mockResolvedValue({ data: { truncated: false, tree } });
    const timings: number[] = [];
    let bytes = 0;
    for (let attempt = 0; attempt < 4; attempt++) {
      const startedAt = performance.now();
      const response = await request('/tree');
      expect(response.status).toBe(200);
      const text = await response.text();
      const body = JSON.parse(text);
      timings.push(performance.now() - startedAt);
      bytes = new TextEncoder().encode(text).length;
      expect(body.items).toHaveLength(count);
      expect(body.page.nextCursor).toBeNull();
      expect(bytes).toBeLessThanOrEqual(8 * 1024 * 1024);
    }
    expect(mocks.branch).toHaveBeenCalledOnce();
    expect(mocks.tree).toHaveBeenCalledOnce();
    expect(mocks.metadata).toHaveBeenCalledTimes(4);
    const warm = timings.slice(1).sort((a, b) => a - b);
    console.info(
      JSON.stringify({
        files: count,
        bytes,
        pages: 1,
        coldMs: Math.round(timings[0] ?? 0),
        warmMedianMs: Math.round(warm[1] ?? 0),
        githubRequestsCold: 2,
        githubRequestsWarm: 0,
      }),
    );
  });
});
