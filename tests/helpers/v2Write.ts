import { env } from 'cloudflare:test';
import { beforeAll, beforeEach, vi } from 'vitest';
import migration from '../../migrations/0003_v2_write_rate_limits.sql?raw';
import { createTestBindings } from './environment';

import { mocks } from './v2WriteMocks';

const sha = 'a'.repeat(40);
const issue = {
  number: 1,
  title: 'Title',
  body: '',
  state: 'open',
  html_url: 'https://github.com/test-owner/test-repo/issues/1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  closed_at: null,
};
const prInput = {
  prTitle: 'Translation',
  branchName: 'translation/test',
  files: [
    { path: 'DCSWorld/new.lua', content: 'translated' },
    { path: 'DCSWorld/old.lua', operation: 'delete' },
  ],
};
const operations = [
  ['POST', '/issues', { title: 'Title', body: '' }, 'createIssue', 201],
  ['PATCH', '/issues/1', { title: 'Title', body: '' }, 'updateIssue', 200],
  ['POST', '/prs', prInput, 'createPullRequest', 200],
] as const;
const request = async (method: string, path: string, body?: unknown, ip = '192.0.2.1', headers: HeadersInit = {}) =>
  (await import('@/index')).default.fetch(
    new Request(`https://api.dcs-translation-japanese.workers.dev/v2${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    createTestBindings({ TREE_METADATA_DB: env.TREE_METADATA_DB }),
  );

beforeAll(async () => {
  await env.TREE_METADATA_DB.batch(
    migration
      .replace(/^--.*$/gm, '')
      .split(';')
      .filter((sql) => sql.trim())
      .map((sql) => env.TREE_METADATA_DB.prepare(sql)),
  );
});
beforeEach(async () => {
  vi.resetAllMocks();
  await env.TREE_METADATA_DB.prepare('DELETE FROM v2_write_attempts').run();
  mocks.createIssue.mockResolvedValue({ data: issue });
  mocks.getIssue.mockResolvedValue({ data: issue });
  mocks.updateIssue.mockResolvedValue({ data: issue });
  mocks.listIssues.mockResolvedValue({ data: [issue] });
  mocks.getRef.mockResolvedValue({ data: { object: { sha } } });
  mocks.getCommit.mockResolvedValue({ data: { tree: { sha } } });
  mocks.createRef.mockResolvedValue({});
  mocks.createTree.mockResolvedValue({ data: { sha } });
  mocks.createCommit.mockResolvedValue({ data: { sha } });
  mocks.updateRef.mockResolvedValue({});
  mocks.createPr.mockResolvedValue({ data: { number: 2, html_url: 'https://github.com/test-owner/test-repo/pull/2' } });
});

export { env } from 'cloudflare:test';
export { consumeV2WriteAttempt } from '@/services/v2WriteRateLimiterService';
export { createTestBindings } from './environment';
export { mocks } from './v2WriteMocks';
export { issue, operations, prInput, request, sha };
