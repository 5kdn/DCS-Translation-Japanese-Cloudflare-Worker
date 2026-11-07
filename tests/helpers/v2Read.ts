/**
 * v2読み取りAPIの統合テストで、GitHub・メタデータDBの応答とキャッシュの初期状態を制御する。
 * @packageDocumentation
 */
import { beforeEach, vi } from 'vitest';
import { createTestBindings } from './environment';

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
/** GitHub Appの認証を行わず、各REST操作をテスト用モックへ接続する代替実装。 */
const octokitMock = {
  App: class {
    /**
     * 実際の認証・通信を行わず、操作別に制御できるGitHubクライアントを返す。
     * @returns Issue・PR・ブランチ・ツリー取得を差し替えたクライアント。
     */
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
};
/** メタデータDBへ接続せず、登録済み更新日時の取得結果を制御する代替実装。 */
const metadataMock = {
  TreePathUpdatedAtService: class {
    /** 各テストで設定したパス別更新日時、または読取エラーを返す。 */
    read = mocks.metadata;
  },
};
/** ブランチ・ツリー・blobで共有する、テスト用の有効な40桁SHA。 */
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
const request = async (path: string, init?: RequestInit) =>
  (await import('@/index')).default.fetch(
    new Request(`https://api.dcs-translation-japanese.workers.dev/v2${path}`, init),
    createTestBindings({ TREE_METADATA_DB: {} as D1Database }),
  );
/** 各テストの前に既定リポジトリのキャッシュを消し、依存先の応答を標準fixtureへ戻す。 */
beforeEach(async () => {
  const prefix = 'https://api.dcs-translation-japanese.workers.dev/__tree-cache/v1/test-owner/test-repo/';
  const cache = await caches.open('v2-tree');
  await Promise.all(['branch/main', `tree/${sha}`].map((key) => cache.delete(prefix + key)));
  vi.resetAllMocks();
  mocks.issues.mockResolvedValue({ data: [issue()] });
  mocks.issue.mockResolvedValue({ data: issue() });
  mocks.prs.mockResolvedValue({ data: [pr()] });
  mocks.pr.mockResolvedValue({ data: pr() });
  mocks.branch.mockResolvedValue({ data: { commit: { sha } } });
  mocks.tree.mockResolvedValue({ data: { truncated: false, tree: [blob()] } });
  mocks.metadata.mockResolvedValue({ 'DCSWorld/a.lua': new Date('2026-01-01T01:02:03.004Z') });
});

export { createTestBindings } from './environment';
export { blob, issue, metadataMock, mocks, octokitMock, pr, request, sha };
