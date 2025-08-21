import type { Octokit } from 'octokit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepositoryPathNotFoundError } from '@/errors/repositoryPathNotFoundError';
import { decodeBase64 } from '@/helpers/base64Helper';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import { fetchRepositoryFile, type GitHubContext, getFilteredTreeItems } from '@/services/githubService';

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
