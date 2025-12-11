import type { Octokit } from 'octokit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepositoryPathNotFoundError } from '@/errors/repositoryPathNotFoundError';
import { UserFacingError } from '@/errors/userFacingError';
import { decodeBase64 } from '@/helpers/base64Helper';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import {
  createIssue,
  createPullRequest,
  fetchRepositoryFile,
  type GitHubContext,
  getFilteredTreeItems,
} from '@/services/githubService';
import type { IssuePayload, PullRequestPayload } from '@/types/types';

vi.mock('@/helpers/base64Helper', () => ({
  decodeBase64: vi.fn(),
}));

vi.mock('@/helpers/pathSafetyHelper', () => ({
  ensureUserPathSafe: vi.fn(),
}));

const decodeBase64Mock = vi.mocked(decodeBase64);
const ensureUserPathSafeMock = vi.mocked(ensureUserPathSafe);

type RestMocks = {
  repos: {
    getBranch: ReturnType<typeof vi.fn>;
    getContent: ReturnType<typeof vi.fn>;
  };
  git: {
    getRef: ReturnType<typeof vi.fn>;
    getCommit: ReturnType<typeof vi.fn>;
    createRef: ReturnType<typeof vi.fn>;
    createTree: ReturnType<typeof vi.fn>;
    createCommit: ReturnType<typeof vi.fn>;
    updateRef: ReturnType<typeof vi.fn>;
    getTree: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };
  pulls: {
    create: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
  issues: {
    create: ReturnType<typeof vi.fn>;
  };
};

const makeOctokit = (): { octokit: Octokit; rest: RestMocks } => {
  const rest: RestMocks = {
    repos: { getBranch: vi.fn(), getContent: vi.fn() },
    git: {
      getRef: vi.fn(),
      getCommit: vi.fn(),
      createRef: vi.fn(),
      createTree: vi.fn(),
      createCommit: vi.fn(),
      updateRef: vi.fn(),
      getTree: vi.fn(),
      getBlob: vi.fn(),
    },
    pulls: {
      create: vi.fn(),
      list: vi.fn(),
    },
    issues: {
      create: vi.fn(),
    },
  };

  const octokit = {
    rest,
  } as unknown as Octokit;

  return { octokit, rest };
};

const ctxOf = (octokit: Octokit): GitHubContext => ({
  octokit,
  owner: 'owner',
  repo: 'repo',
  defaultBranch: 'master',
});

describe('getFilteredTreeItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('DCSWorld/ と UserMissions/ 配下の blob だけを返す。.git を含むものは除外', async () => {
    const { octokit, rest } = makeOctokit();

    rest.repos.getBranch.mockResolvedValue({
      data: { commit: { sha: 'commit-sha' } },
    } as unknown as Awaited<ReturnType<typeof rest.repos.getBranch>>);

    rest.git.getTree.mockResolvedValue({
      data: {
        tree: [
          // 対象
          { type: 'blob', path: 'DCSWorld/Mods/a.txt', sha: 'sha-a', size: 10, url: 'u-a' },
          { type: 'blob', path: 'UserMissions/Mission1/file.lua', sha: 'sha-u', size: 30, url: 'u-u' },
          // typeがblob以外は除外
          { type: 'tree', path: 'DCSWorld/Mods', sha: 'sha-t', url: 'u-t' },
          // 先頭がDCSWorld/でない
          { type: 'blob', path: 'Other/file.bin', sha: 'sha-b', size: 20, url: 'u-b' },
          // .gitを含むものは除外
          { type: 'blob', path: 'DCSWorld/.git/index', sha: 'sha-g', size: 1, url: 'u-g' },
          { type: 'blob', path: '.git/config', sha: 'sha-g2', size: 1, url: 'u-g2' },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof rest.git.getTree>>);

    const items = await getFilteredTreeItems(ctxOf(octokit));

    expect(items).toEqual([
      {
        path: 'DCSWorld/Mods/a.txt',
        sha: 'sha-a',
        size: 10,
        url: 'u-a',
        type: 'blob',
      },
      {
        path: 'UserMissions/Mission1/file.lua',
        sha: 'sha-u',
        size: 30,
        url: 'u-u',
        type: 'blob',
      },
    ]);
    expect(rest.git.getTree).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      tree_sha: 'commit-sha',
      recursive: 'true',
    });
  });
});

describe('fetchRepositoryFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('許可されたファイルを取得してBase64をデコードする', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});
    const decoded = new Uint8Array([1, 2, 3]);
    decodeBase64Mock.mockReturnValue(decoded);

    rest.repos.getContent.mockResolvedValue({
      data: {
        type: 'file',
        path: 'DCSWorld/Mods/file.txt',
        size: 42,
        sha: 'sha-file',
        content: 'YQ==\n',
      },
    } as unknown as Awaited<ReturnType<typeof rest.repos.getContent>>);

    const result = await fetchRepositoryFile(ctxOf(octokit), 'DCSWorld/Mods/file.txt');

    expect(ensureUserPathSafeMock).toHaveBeenCalledWith('DCSWorld/Mods/file.txt');
    expect(rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: 'DCSWorld/Mods/file.txt',
      ref: 'master',
    });
    expect(decodeBase64Mock).toHaveBeenCalledWith('YQ==');
    expect(result).toEqual({
      path: 'DCSWorld/Mods/file.txt',
      size: 42,
      sha: 'sha-file',
      content: decoded,
    });
  });

  it('サイズ情報がない場合はデコード後の長さを返す', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});
    const decoded = new Uint8Array([9, 9]);
    decodeBase64Mock.mockReturnValue(decoded);

    rest.repos.getContent.mockResolvedValue({
      data: {
        type: 'file',
        path: 'DCSWorld/Mods/size.txt',
        size: undefined,
        sha: 'sha-size',
        content: 'YWI=',
      },
    } as unknown as Awaited<ReturnType<typeof rest.repos.getContent>>);

    const result = await fetchRepositoryFile(ctxOf(octokit), 'DCSWorld/Mods/size.txt');

    expect(result.size).toBe(2);
    expect(result.content).toBe(decoded);
  });

  it('許可対象外のパスはUserFacingErrorを投げる', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});

    await expect(fetchRepositoryFile(ctxOf(octokit), 'Other/path.lua')).rejects.toMatchObject({
      code: 'FORBIDDEN_PATH',
      status: 403,
    });
    expect(rest.repos.getContent).not.toHaveBeenCalled();
  });

  it('ディレクトリのレスポンスではUserFacingErrorを投げる', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});

    rest.repos.getContent.mockResolvedValue({
      data: [] as unknown as Awaited<ReturnType<typeof rest.repos.getContent>>['data'],
    } as Awaited<ReturnType<typeof rest.repos.getContent>>);

    await expect(fetchRepositoryFile(ctxOf(octokit), 'DCSWorld/Mods')).rejects.toMatchObject({
      code: 'DIRECTORY_NOT_ALLOWED',
      status: 422,
    });
  });

  it('ファイル以外のレスポンスではUserFacingErrorを投げる', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});

    rest.repos.getContent.mockResolvedValue({
      data: {
        type: 'symlink',
        path: 'DCSWorld/Mods/link',
        size: 0,
        sha: 'sha-link',
        content: 'YQ==',
      },
    } as unknown as Awaited<ReturnType<typeof rest.repos.getContent>>);

    await expect(fetchRepositoryFile(ctxOf(octokit), 'DCSWorld/Mods/link')).rejects.toMatchObject({
      code: 'UNSUPPORTED_CONTENT',
      status: 422,
    });
  });

  it('GitHub API が 404 を返した場合はRepositoryPathNotFoundErrorを投げる', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});

    const notFound = Object.assign(new Error('not found'), { status: 404 });
    rest.repos.getContent.mockRejectedValue(notFound);

    await expect(fetchRepositoryFile(ctxOf(octokit), 'DCSWorld/Mods/missing.lua')).rejects.toBeInstanceOf(
      RepositoryPathNotFoundError,
    );
  });

  it('404以外のエラーはそのまま伝播する', async () => {
    const { octokit, rest } = makeOctokit();
    ensureUserPathSafeMock.mockImplementation(() => {});

    const unknown = Object.assign(new Error('boom'), { status: 500 });
    rest.repos.getContent.mockRejectedValue(unknown);

    await expect(fetchRepositoryFile(ctxOf(octokit), 'DCSWorld/Mods/boom.lua')).rejects.toBe(unknown);
  });
});

describe('createPullRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseStubs = (rest: RestMocks) => {
    rest.git.getRef.mockResolvedValue({ data: { object: { sha: 'base-commit-sha' } } } as Partial<
      ReturnType<typeof rest.git.getRef>
    >);
    rest.git.getCommit.mockResolvedValue({ data: { tree: { sha: 'base-tree-sha' } } } as unknown as Awaited<
      ReturnType<typeof rest.git.getCommit>
    >);
    rest.git.createRef.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof rest.git.createRef>>);
    rest.git.createTree.mockResolvedValue({ data: { sha: 'new-tree-sha' } } as unknown as Awaited<
      ReturnType<typeof rest.git.createTree>
    >);
    rest.git.createCommit.mockResolvedValue({ data: { sha: 'new-commit-sha' } } as unknown as Awaited<
      ReturnType<typeof rest.git.createCommit>
    >);
    rest.git.updateRef.mockResolvedValue({} as unknown as Awaited<ReturnType<typeof rest.git.updateRef>>);
  };

  it('正常系: 新規PRを作成して結果を返す', async () => {
    const { octokit, rest } = makeOctokit();
    baseStubs(rest);
    rest.pulls.create.mockResolvedValue({
      data: { number: 123, html_url: 'https://example/pr/123' },
    } as unknown as Awaited<ReturnType<typeof rest.pulls.create>>);

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
    } as unknown as Awaited<ReturnType<typeof rest.pulls.list>>);

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

describe('createIssue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: タイトルをtrimし、ラベル・アサインを正規化してIssueを作成する', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockResolvedValue({
      data: { number: 7, html_url: 'https://example/issues/7' },
    } as unknown as Awaited<ReturnType<typeof rest.issues.create>>);

    const payload: IssuePayload = {
      title: '  bug report  ',
      body: 'body',
      labels: [' bug ', 'feature', 'bug'],
      assignees: [' alice ', 'bob', 'alice'],
    };

    const result = await createIssue(payload, ctxOf(octokit));

    expect(result).toEqual({
      issueNumber: 7,
      issueUrl: 'https://example/issues/7',
    });
    expect(rest.issues.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'bug report',
      body: 'body',
      labels: ['bug', 'feature'],
      assignees: ['alice', 'bob'],
    });
  });

  it('バリデーションエラー: title 必須', async () => {
    const { octokit } = makeOctokit();
    const payload = { title: '   ' } as IssuePayload;

    const result = await createIssue(payload, ctxOf(octokit));

    expect(result).toEqual({
      error: 'validation error',
      detail: 'title は必須',
      code: 'VALIDATION_ERROR',
    });
  });

  it('バリデーションエラー: labels は配列で指定する', async () => {
    const { octokit } = makeOctokit();
    const payload = { title: 'bug', labels: 'bug' } as unknown as IssuePayload;

    const result = await createIssue(payload, ctxOf(octokit));

    expect(result).toMatchObject({ error: 'validation error', code: 'VALIDATION_ERROR' });
    expect((result as { detail: string }).detail).toContain('labels は string 配列で指定する');
  });

  it('Issue が無効化されている場合は UserFacingError を投げる', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockRejectedValue({ status: 410 });

    await expect(createIssue({ title: 'bug' }, ctxOf(octokit))).rejects.toBeInstanceOf(UserFacingError);
  });

  it('権限不足の場合は UserFacingError を投げる', async () => {
    const { octokit, rest } = makeOctokit();
    rest.issues.create.mockRejectedValue({ status: 403 });

    await expect(createIssue({ title: 'bug' }, ctxOf(octokit))).rejects.toBeInstanceOf(UserFacingError);
  });

  it('未知のエラーは failure で返す', async () => {
    const { octokit, rest } = makeOctokit();
    const error = Object.assign(new Error('boom'), { status: 500 });
    rest.issues.create.mockRejectedValue(error);

    const result = await createIssue({ title: 'bug' }, ctxOf(octokit));

    expect(result).toEqual({
      error: 'failed to create issue',
      detail: 'boom',
    });
  });
});
