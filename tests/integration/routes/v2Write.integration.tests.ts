/** v2書き込みの実ルート・D1共有枠・OAS応答を検証する。 */

import { env } from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '@/index';
import { consumeV2WriteAttempt } from '@/services/v2WriteRateLimiterService';
import migration from '../../../migrations/0003_v2_write_rate_limits.sql?raw';
import { createTestBindings } from '../../helpers/environment';
import { expectV2Contract } from '../../helpers/v2Contract';

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
vi.mock('octokit', () => ({
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
}));
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
const request = (method: string, path: string, body?: unknown, ip = '192.0.2.1', headers: HeadersInit = {}) =>
  worker.fetch(
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

describe('v2 write contracts', () => {
  it.each(operations)('%s %s writes without login', async (method, path, body, operation, status) => {
    const response = await request(method, path, body, undefined, { Authorization: 'Bearer invalid' });
    expect(response.status).toBe(status);
    await expectV2Contract(response, operation);
  });
  it('creates issues with configured repository, labels and assignees', async () => {
    const response = await request('POST', '/issues', { title: 'Title', labels: ['bug'], assignees: ['user'] });
    expect(response.status).toBe(201);
    expect(mocks.createIssue).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      title: 'Title',
      labels: ['bug'],
      assignees: ['user'],
    });
  });
  it('edits directly-created and closed issues without changing metadata', async () => {
    mocks.getIssue.mockResolvedValue({ data: { ...issue, state: 'closed', user: { login: 'someone-else' } } });
    const response = await request('PATCH', '/issues/1', { body: '' });
    expect(response.status).toBe(200);
    expect(mocks.updateIssue).toHaveBeenCalledWith({ owner: 'test-owner', repo: 'test-repo', issue_number: 1, body: '' });
  });
  it.each(['labels', 'assignees', 'state', 'state_reason', 'locked'])('rejects editing %s', async (key) => {
    const response = await request('PATCH', '/issues/1', { title: 'Title', [key]: 'invalid' });
    expect(response.status).toBe(400);
    await expectV2Contract(response, 'updateIssue');
    expect(mocks.updateIssue).not.toHaveBeenCalled();
  });
  it('never edits a PR through the issue endpoint', async () => {
    mocks.getIssue.mockResolvedValue({ data: { ...issue, pull_request: { url: 'https://github.com/o/r/pull/1' } } });
    const response = await request('PATCH', '/issues/1', { title: 'Title' });
    expect(response.status).toBe(404);
    await expectV2Contract(response, 'updateIssue');
    expect(mocks.updateIssue).not.toHaveBeenCalled();
  });
  it('creates a commit from upserts and deletes without force-pushing', async () => {
    const response = await request('POST', '/prs', prInput);
    expect(response.status).toBe(200);
    expect(await expectV2Contract(response, 'createPullRequest')).toMatchObject({
      number: 2,
      branchName: prInput.branchName,
      commitSha: sha,
      reused: false,
    });
    expect(mocks.createTree).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      base_tree: sha,
      tree: [
        { path: 'DCSWorld/new.lua', mode: '100644', type: 'blob', content: 'translated' },
        { path: 'DCSWorld/old.lua', mode: '100644', type: 'blob', sha: null },
      ],
    });
    expect(mocks.updateRef).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      ref: 'heads/translation/test',
      sha,
      force: false,
    });
    expect(mocks.createPr).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      head: 'translation/test',
      base: 'main',
      title: 'Translation',
    });
  });
  it.each([
    [{ status: 404 }, 404],
    [{ status: 422 }, 422],
    [{ status: 409 }, 409],
    [{ status: 403 }, 403],
    [{ status: 429, response: { headers: { 'retry-after': '12' } } }, 503],
  ] as const)('maps issue edit failures %j to %s', async (error, status) => {
    mocks.getIssue.mockRejectedValue(error);
    const response = await request('PATCH', '/issues/1', { title: 'Title' });
    expect(response.status).toBe(status);
    await expectV2Contract(response, 'updateIssue');
    if (status === 503) expect(response.headers.get('Retry-After')).toBe('12');
    expect(mocks.updateIssue).not.toHaveBeenCalled();
  });
  it.each(['main', '../bad', 'with space', 'branch.lock', 'bad@{ref', 'bad\\\\ref', 'bad//ref'])(
    'rejects unsafe branch %s',
    async (branchName) => {
      const response = await request('POST', '/prs', { ...prInput, branchName });
      expect(response.status).toBe(422);
      await expectV2Contract(response, 'createPullRequest');
      expect(mocks.createRef).not.toHaveBeenCalled();
    },
  );
  it.each(['/etc/passwd', 'DCSWorld/../bad', 'DCSWorld/.git/config', 'README.md', 'DCSWorld/a\\\\b.lua'])(
    'rejects unsafe PR path %s',
    async (path) => {
      const response = await request('POST', '/prs', { ...prInput, files: [{ path, content: 'x' }] });
      expect(response.status).toBe(400);
      await expectV2Contract(response, 'createPullRequest');
      expect(mocks.createRef).not.toHaveBeenCalled();
    },
  );
  it('rejects duplicate file paths before creating a branch', async () => {
    const response = await request('POST', '/prs', { ...prInput, files: [prInput.files[0], prInput.files[0]] });
    expect(response.status).toBe(422);
    expect(mocks.createRef).not.toHaveBeenCalled();
  });
  it('returns conflict without modifying an existing branch', async () => {
    mocks.createRef.mockRejectedValue({ status: 422 });
    const response = await request('POST', '/prs', prInput);
    expect(response.status).toBe(409);
    await expectV2Contract(response, 'createPullRequest');
    expect(mocks.updateRef).not.toHaveBeenCalled();
    expect(mocks.createTree).not.toHaveBeenCalled();
  });
  it('reuses the open PR when GitHub reports that it already exists', async () => {
    mocks.createPr.mockRejectedValue({ status: 422 });
    mocks.listPrs.mockResolvedValue({ data: [{ number: 2, html_url: 'https://github.com/test-owner/test-repo/pull/2' }] });
    const response = await request('POST', '/prs', { ...prInput, prBody: 'Body', commitMessage: 'Commit' });
    expect(response.status).toBe(200);
    expect(await expectV2Contract(response, 'createPullRequest')).toMatchObject({ reused: true });
    expect(mocks.createCommit).toHaveBeenCalledWith(expect.objectContaining({ message: 'Commit' }));
    expect(mocks.createPr).toHaveBeenCalledWith(expect.objectContaining({ body: 'Body' }));
    expect(mocks.listPrs).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      state: 'open',
      head: 'test-owner:translation/test',
      base: 'main',
    });
  });
  it('returns 422 when PR creation is rejected without an existing PR', async () => {
    mocks.createPr.mockRejectedValue({ status: 422 });
    mocks.listPrs.mockResolvedValue({ data: [] });
    const response = await request('POST', '/prs', prInput);
    expect(response.status).toBe(422);
    await expectV2Contract(response, 'createPullRequest');
  });
  it.each([
    ['DELETE', '/issues/1'],
    ['PUT', '/issues/1'],
    ['POST', '/issues/1/lock'],
    ['PATCH', '/prs/1'],
    ['DELETE', '/prs/1'],
  ] as const)('does not offer %s %s', async (method, path) => {
    const response = await request(method, path, {});
    expect([404, 405]).toContain(response.status);
    expect(mocks.updateIssue).not.toHaveBeenCalled();
    expect(mocks.updateRef).not.toHaveBeenCalled();
  });
  it('allows PATCH CORS only on v2 and exposes Retry-After', async () => {
    for (const path of ['/v2/issues/1', '/issue/create']) {
      const response = await worker.fetch(
        new Request(`https://example.com${path}`, {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://allowed.example',
            'Access-Control-Request-Method': 'PATCH',
          },
        }),
        createTestBindings({ AllowOrigins: 'https://allowed.example' }),
      );
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')?.includes('PATCH')).toBe(path.startsWith('/v2/'));
    }
    const response = await worker.fetch(
      new Request('https://example.com/v2/issues', {
        method: 'POST',
        headers: {
          Origin: 'https://allowed.example',
          'CF-Connecting-IP': '192.0.2.1',
        },
      }),
      createTestBindings({ AllowOrigins: 'https://allowed.example', TREE_METADATA_DB: env.TREE_METADATA_DB }),
    );
    expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Retry-After');
  });
  it.each(operations)('%s %s hides upstream failures', async (method, path, body, operation) => {
    for (const mock of [mocks.createIssue, mocks.getIssue, mocks.getRef])
      mock.mockRejectedValue({ status: 500, message: 'private upstream data' });
    const response = await request(method, path, body);
    expect(response.status).toBe(502);
    expect(JSON.stringify(await expectV2Contract(response, operation))).not.toContain('private upstream data');
  });
});

describe('strict shared sliding write limit', () => {
  it('fails closed when the trusted IP or database is missing', async () => {
    for (const [bindings, headers] of [
      [createTestBindings(), { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }],
      [createTestBindings({ TREE_METADATA_DB: env.TREE_METADATA_DB }), { 'Content-Type': 'application/json' }],
    ] as const) {
      const response = await worker.fetch(
        new Request('https://example.com/v2/issues', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: 'Title' }),
        }),
        bindings,
      );
      expect(response.status).toBe(503);
      expect(response.headers.get('Retry-After')).toBe('60');
      await expectV2Contract(response, 'createIssue');
    }
    expect(mocks.createIssue).not.toHaveBeenCalled();
  });
  it('fails closed on D1 failure without leaking details or writing to GitHub', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const db = {
        prepare: env.TREE_METADATA_DB.prepare.bind(env.TREE_METADATA_DB),
        batch: vi.fn().mockRejectedValue(new Error('private D1 details')),
      } as unknown as D1Database;
      const response = await worker.fetch(
        new Request('https://example.com/v2/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
          body: JSON.stringify({ title: 'Title' }),
        }),
        createTestBindings({ TREE_METADATA_DB: db }),
      );
      expect(response.status).toBe(503);
      expect(JSON.stringify(await expectV2Contract(response, 'createIssue'))).not.toContain('private D1 details');
      expect(mocks.createIssue).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
  it('counts oversized bodies before rejecting them', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/v2/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
        body: 'a'.repeat(5 * 1024 * 1024 + 1),
      }),
      createTestBindings({ TREE_METADATA_DB: env.TREE_METADATA_DB }),
    );
    expect(response.status).toBe(413);
    for (let i = 0; i < 9; i++) expect((await request('POST', '/issues', {})).status).toBe(400);
    expect((await request('POST', '/issues', {})).status).toBe(429);
  });
  it('shares ten attempts across all three operations and returns Retry-After', async () => {
    for (let i = 0; i < 10; i++) {
      const [method, path, body, , status] = operations[i % operations.length] ?? operations[0];
      expect((await request(method, path, body)).status).toBe(status);
    }
    for (const [method, path, body, operation] of operations) {
      const response = await request(method, path, body);
      expect(response.status).toBe(429);
      expect(Number(response.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
      expect(Number(response.headers.get('Retry-After'))).toBeLessThanOrEqual(300);
      await expectV2Contract(response, operation);
    }
    expect((await request('POST', '/issues', { title: 'other IP' }, '192.0.2.2')).status).toBe(201);
  });
  it('serializes concurrent requests using the real D1 database', async () => {
    const responses = await Promise.all(Array.from({ length: 20 }, () => request('POST', '/issues', {})));
    expect(responses.filter((r) => r.status === 400)).toHaveLength(10);
    expect(responses.filter((r) => r.status === 429)).toHaveLength(10);
  });
  it('counts malformed JSON, invalid media, invalid parameters and GitHub failures', async () => {
    mocks.createIssue.mockRejectedValue({ status: 500 });
    for (let i = 0; i < 7; i++) expect((await request('POST', '/issues', { title: 'Title' })).status).toBe(502);
    expect((await request('POST', '/issues', {}, undefined, { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await request('PATCH', '/issues/not-a-number', { title: 'Title' })).status).toBe(400);
    const malformed = await worker.fetch(
      new Request('https://example.com/v2/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
        body: '{',
      }),
      createTestBindings({ TREE_METADATA_DB: env.TREE_METADATA_DB }),
    );
    expect(malformed.status).toBe(400);
    expect((await request('POST', '/issues', {})).status).toBe(429);
  });
  it('expires individual attempts rather than resetting the whole window; rejection does not extend it', async () => {
    const db = env.TREE_METADATA_DB;
    const ip = '192.0.2.1';
    const start = 1_800_000_000_000;
    expect(await consumeV2WriteAttempt(db, ip, start)).toBeNull();
    for (let i = 0; i < 9; i++) expect(await consumeV2WriteAttempt(db, ip, start + 150_000)).toBeNull();
    expect(await consumeV2WriteAttempt(db, ip, start + 299_999)).toBe(1);
    expect(await consumeV2WriteAttempt(db, ip, start + 300_000)).toBeNull();
    expect(await consumeV2WriteAttempt(db, ip, start + 300_000)).toBe(150);
    expect(await consumeV2WriteAttempt(db, ip, start + 600_000)).toBeNull();
  });
  it('uses the database clock and frees expired attempts through the route', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(0);
    try {
      for (let i = 0; i < 10; i++) expect((await request('POST', '/issues', {})).status).toBe(400);
      const row = await env.TREE_METADATA_DB.prepare('SELECT attempted_at, ip_hash FROM v2_write_attempts LIMIT 1').first<{
        attempted_at: number;
        ip_hash: string;
      }>();
      expect(row?.attempted_at).toBeGreaterThan(1_000_000_000_000);
      expect(row?.ip_hash).toMatch(/^[a-f0-9]{64}$/);
      expect((await request('POST', '/issues', {})).status).toBe(429);
      await env.TREE_METADATA_DB.prepare('UPDATE v2_write_attempts SET attempted_at = attempted_at - 300000').run();
      expect((await request('POST', '/issues', {})).status).toBe(400);
    } finally {
      clock.mockRestore();
    }
  });
  it('does not trust X-Forwarded-For to bypass the shared limit', async () => {
    for (let i = 0; i < 10; i++) await request('POST', '/issues', {});
    expect((await request('POST', '/issues', {}, undefined, { 'X-Forwarded-For': '192.0.2.99' })).status).toBe(429);
  });
  it('keeps reads, metadata and legacy requests outside the shared quota', async () => {
    for (let i = 0; i < 11; i++) {
      expect((await request('GET', '/issues')).status).toBe(200);
      expect((await request('PATCH', '/tree-metadata', [])).status).toBe(404);
      const legacy = await worker.fetch(
        new Request('https://example.com/issue/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
          body: JSON.stringify({ title: 'Legacy' }),
        }),
        createTestBindings({ TREE_METADATA_DB: env.TREE_METADATA_DB }),
      );
      expect(legacy.status).toBe(200);
      expect(await legacy.json()).toMatchObject({ success: true, data: [{ issueNumber: 1 }] });
      const metadata = await worker.fetch(
        new Request('https://example.com/tree-metadata/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
          body: '[]',
        }),
        createTestBindings({ TREE_METADATA_DB: env.TREE_METADATA_DB }),
      );
      expect(metadata.status).toBe(401);
    }
    for (let i = 0; i < 10; i++) expect((await request('POST', '/issues', {})).status).toBe(400);
    expect((await request('POST', '/issues', {})).status).toBe(429);
    expect((await request('GET', '/issues')).status).toBe(200);
  });
});
