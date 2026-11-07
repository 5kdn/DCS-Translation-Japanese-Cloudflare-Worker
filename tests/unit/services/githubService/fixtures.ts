/** GitHubサービスの単体テストで共有するOctokitモックとリポジトリ設定。 */
import type { Octokit } from 'octokit';
import { vi } from 'vitest';
import type { GitHubContext } from '@/services/githubService/context';

export type RestMocks = {
  repos: {
    getBranch: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    getContent: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
  };
  git: {
    getRef: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    getCommit: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    createRef: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    createTree: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    createCommit: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    updateRef: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    getTree: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    getBlob: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
  };
  pulls: {
    create: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
    list: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
  };
  issues: {
    create: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;
  };
};

export const makeOctokit = (): { octokit: Octokit; rest: RestMocks } => {
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

export const ctxOf = (octokit: Octokit): GitHubContext => ({
  octokit,
  owner: 'owner',
  repo: 'repo',
  defaultBranch: 'master',
});
