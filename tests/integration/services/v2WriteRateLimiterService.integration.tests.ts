import { describe, expect, it, vi } from 'vitest';
import worker from '@/index';
import { expectV2Contract } from '../../helpers/v2Contract';
import { consumeV2WriteAttempt, createTestBindings, env, mocks, operations, request } from '../../helpers/v2Write';

vi.mock('octokit', async () => (await import('../../helpers/v2WriteMocks')).octokitMock);

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
      expect((await request('PATCH', '/tree-metadata', [])).status).toBe(400);
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
