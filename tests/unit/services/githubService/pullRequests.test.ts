import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPullRequest } from '@/services/githubService/pullRequests';
import type { PullRequestPayload } from '@/types/types';
import { ctxOf, makeOctokit, type RestMocks } from './fixtures';

vi.mock('@/helpers/pathSafetyHelper', () => ({ ensureUserPathSafe: vi.fn() }));

describe('createPullRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseStubs = (rest: RestMocks) => {
    rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'base-commit-sha' } } });
    rest.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'base-tree-sha' } } });
    rest.git.createRef.mockResolvedValue({});
    rest.git.createTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } });
    rest.git.createCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } });
    rest.git.updateRef.mockResolvedValue({});
  };

  it('正常系: 新規PRを作成して結果を返す', async () => {
    const { octokit, rest } = makeOctokit();
    baseStubs(rest);
    rest.pulls.create.mockResolvedValue({
      data: { number: 123, html_url: 'https://example/pr/123' },
    });

    const payload: PullRequestPayload = {
      prTitle: 'feat: add files',
      prBody: 'body',
      branchName: 'feature/newBranch',
      files: [
        { path: 'DCSWorld/dir/a.txt', content: 'A', operation: 'upsert' },
        { path: 'DCSWorld/dir/b.txt', content: 'B', operation: 'upsert' },
        { path: 'DCSWorld/dir/c.txt', operation: 'delete' },
      ],
    };

    const result = await createPullRequest(payload, ctxOf(octokit));

    expect(result).toEqual({
      prNumber: 123,
      prUrl: 'https://example/pr/123',
      branchName: expect.stringMatching(/^feature\//),
      commitSha: 'new-commit-sha',
    });

    // 呼び出し引数の検証
    expect(rest.git.getRef).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', ref: 'heads/master' });
    expect(rest.git.createRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: expect.stringMatching(/^refs\/heads\/feature\//),
      sha: 'base-commit-sha',
    });

    expect(rest.git.createTree).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base_tree: 'base-tree-sha',
      tree: [
        { path: 'DCSWorld/dir/a.txt', mode: '100644', type: 'blob', content: 'A' },
        { path: 'DCSWorld/dir/b.txt', mode: '100644', type: 'blob', content: 'B' },
        { path: 'DCSWorld/dir/c.txt', mode: '100644', type: 'blob', sha: null },
      ],
    });

    expect(rest.pulls.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      head: expect.stringMatching(/^feature\//),
      base: 'master',
      title: 'feat: add files',
      body: 'body',
    });
  });

  it('既存PRがある場合: 422でlistから取得してnote付きで返す', async () => {
    const { octokit, rest } = makeOctokit();
    baseStubs(rest);
    rest.pulls.create.mockRejectedValue({ status: 422 });
    rest.pulls.list.mockResolvedValue({
      data: [{ number: 9, html_url: 'https://example/pr/9' }],
    });

    const payload: PullRequestPayload = {
      prTitle: 'fix: patch',
      prBody: 'body',
      branchName: 'fix/exist',
      files: [{ path: 'DCSWorld/x.txt', content: 'x' }],
    };

    const result = await createPullRequest(payload, ctxOf(octokit));

    expect(result).toEqual({
      prNumber: 9,
      prUrl: 'https://example/pr/9',
      branchName: 'fix/exist',
      commitSha: 'new-commit-sha',
      note: 'existing pull request',
    });
    expect(rest.pulls.list).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      state: 'open',
      head: 'owner:fix/exist',
      base: 'master',
    });
  });

  it('バリデーションエラー: title必須やfiles必須', async () => {
    const { octokit } = makeOctokit();
    const payload = { prTitle: '', files: [] } as unknown as PullRequestPayload;

    const result = await createPullRequest(payload, ctxOf(octokit));

    expect(result).toEqual({
      error: 'validation error',
      detail: 'title と files は必須',
      code: 'VALIDATION_ERROR',
    });
  });

  it('バリデーションエラー: upsertでcontent必須', async () => {
    const { octokit } = makeOctokit();
    const payload = {
      prTitle: 'x',
      files: [{ path: 'DCSWorld/a.txt', operation: 'upsert' }], // content欠如
    } as unknown as PullRequestPayload;

    const result = await createPullRequest(payload, ctxOf(octokit));
    expect(result).toMatchObject({ error: 'validation error', code: 'VALIDATION_ERROR' });
    expect((result as { detail: string }).detail).toContain('files.content は必須');
  });

  it('バリデーションエラー: 許可範囲外のパス', async () => {
    const { octokit } = makeOctokit();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const payload = {
      prTitle: 'x',
      files: [{ path: 'Other/file.txt', content: 'x' }],
    } as unknown as PullRequestPayload;

    const result = await createPullRequest(payload, ctxOf(octokit));
    expect(result).toEqual({
      error: 'validation error',
      detail: 'files.path が許可範囲外である: Other/file.txt',
      code: 'VALIDATION_ERROR',
    });
    expect(spy).toHaveBeenCalledWith('[file-permission] disallowed paths detected', {
      requestedPath: 'Other/file.txt',
      invalidPaths: ['Other/file.txt'],
    });
    spy.mockRestore();
  });
});
