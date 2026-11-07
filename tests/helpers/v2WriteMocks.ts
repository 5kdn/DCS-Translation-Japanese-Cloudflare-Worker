import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createIssue: vi.fn(),
  getIssue: vi.fn(),
  updateIssue: vi.fn(),
  listIssues: vi.fn(),
  getRef: vi.fn(),
  getCommit: vi.fn(),
  createRef: vi.fn(),
  createTree: vi.fn(),
  createCommit: vi.fn(),
  updateRef: vi.fn(),
  createPr: vi.fn(),
  listPrs: vi.fn(),
}));
const octokitMock = {
  App: class {
    async getInstallationOctokit() {
      return {
        rest: {
          issues: { create: mocks.createIssue, get: mocks.getIssue, update: mocks.updateIssue, listForRepo: mocks.listIssues },
          git: {
            getRef: mocks.getRef,
            getCommit: mocks.getCommit,
            createRef: mocks.createRef,
            createTree: mocks.createTree,
            createCommit: mocks.createCommit,
            updateRef: mocks.updateRef,
          },
          pulls: { create: mocks.createPr, list: mocks.listPrs },
        },
      };
    }
  },
};

export { mocks, octokitMock };
