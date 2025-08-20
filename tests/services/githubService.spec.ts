import type { Octokit } from 'octokit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type GitHubContext,
  getFilteredTreeItems,
} from '@/services/githubService';

type RestMocks = {
  repos: {
    getBranch: ReturnType<typeof vi.fn>;
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
    repos: { getBranch: vi.fn() },
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
    vi.restoreAllMocks();
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
