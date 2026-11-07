import { env } from 'cloudflare:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '@/index';
import { JwtVerificationService } from '@/services/jwtVerificationService';
import { TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';
import type { Bindings } from '@/types/env';
import metadataMigration from '../../../../../../migrations/0001_tree_path_updated_at.sql?raw';
import replayMigration from '../../../../../../migrations/0002_used_jti.sql?raw';
import quotaMigration from '../../../../../../migrations/0003_v2_write_rate_limits.sql?raw';
import { createTestBindings } from '../../../../../helpers/environment';
import { expectV2Contract } from '../../../../../helpers/v2Contract';

const now = Date.now();
const subject = 'repo:test-owner/test-repo:ref:refs/heads/main';
const claims = {
  sub: subject,
  repository: 'test-owner/test-repo',
  repository_owner: 'test-owner',
  ref: 'refs/heads/main',
  workflow_ref: 'test-owner/test-repo/.github/workflows/tree-metadata-sender.yml@refs/heads/main',
  job_workflow_ref: 'test-owner/test-repo/.github/workflows/tree-metadata-sender.yml@refs/heads/main',
};
const bindings = (): Bindings =>
  createTestBindings({
    TREE_METADATA_DB: env.TREE_METADATA_DB,
    JWT_REPLAY_DB: env.JWT_REPLAY_DB,
    TREE_METADATA_OIDC_SUBJECT: subject,
  });
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let otherKeys: Awaited<ReturnType<typeof generateKeyPair>>;
const token = async (overrides: Record<string, unknown> = {}, privateKey = keys.privateKey): Promise<string> =>
  new SignJWT({
    ...claims,
    iss: JwtVerificationService.ISSUER,
    aud: 'tree-metadata',
    exp: Math.floor(now / 1000) + 3600,
    jti: crypto.randomUUID(),
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .sign(privateKey);
const entry = (path = 'DCSWorld/new.lua', updatedAt = new Date(now).toISOString()) => ({ path, updatedAt });
const request = async (
  body: unknown = [entry()],
  authorization?: string,
  overrides: Partial<Bindings> = {},
): Promise<Response> =>
  worker.fetch(
    new Request('https://example.com/v2/tree-metadata', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(authorization === undefined ? {} : { Authorization: authorization }) },
      body: JSON.stringify(body),
    }),
    { ...bindings(), ...overrides },
  );
const expectProblem = async (response: Response, status: number, code: string): Promise<void> => {
  expect(response.status).toBe(status);
  expect(await expectV2Contract(response, 'upsertTreeMetadata')).toMatchObject({ code, instance: '/v2/tree-metadata' });
  if (status === 401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer realm="tree-metadata", error="invalid_token"');
};
const rowCount = async (
  db: D1Database,
  table: 'used_jti' | 'tree_path_updated_at' | 'v2_write_attempts',
): Promise<number | null> => db.prepare(`SELECT COUNT(*) FROM ${table}`).first<number>('COUNT(*)');

beforeAll(async () => {
  keys = await generateKeyPair('RS256', { extractable: true });
  otherKeys = await generateKeyPair('RS256');
  const jwk = await exportJWK(keys.publicKey);
  vi.spyOn(JwtVerificationService, 'JWKS').mockImplementation(
    createLocalJWKSet({ keys: [{ ...jwk, kid: 'test', alg: 'RS256' }] }),
  );
  for (const [db, migration] of [
    [env.TREE_METADATA_DB, metadataMigration],
    [env.JWT_REPLAY_DB, replayMigration],
    [env.TREE_METADATA_DB, quotaMigration],
  ] as const) {
    await db.batch(
      migration
        .replace(/^--.*$/gm, '')
        .split(';')
        .filter((sql) => sql.trim())
        .map((sql) => db.prepare(sql)),
    );
  }
});
beforeEach(async () => {
  vi.spyOn(Date, 'now').mockReturnValue(now);
  await env.TREE_METADATA_DB.exec(
    'DROP TRIGGER IF EXISTS fail_metadata; DELETE FROM tree_path_updated_at; DELETE FROM v2_write_attempts;',
  );
  await env.JWT_REPLAY_DB.exec('DELETE FROM used_jti');
});
afterAll(() => vi.restoreAllMocks());

describe('PATCH /v2/tree-metadata', () => {
  it('upserts RFC 3339 offsets and sub-milliseconds as epoch milliseconds without deleting existing data', async () => {
    await new TreePathUpdatedAtService(env.TREE_METADATA_DB).upsert([
      { path: 'DCSWorld/existing.lua', updatedAt: 123 },
      { path: 'UserMissions/keep.lua', updatedAt: 456 },
    ]);
    const time = new Date(now - 1000).toISOString();
    const offset = new Date(now - 1000 + 9 * 3600000).toISOString().replace('Z', '+09:00');
    const response = await request(
      [entry('DCSWorld/existing.lua', offset), entry('DCSWorld/not-in-git.lua', time.replace('Z', '999Z'))],
      `Bearer ${await token()}`,
    );
    expect(response.status).toBe(200);
    expect(await expectV2Contract(response, 'upsertTreeMetadata')).toEqual({ updatedCount: 2 });
    const rows = await env.TREE_METADATA_DB.prepare('SELECT path, updated_at FROM tree_path_updated_at ORDER BY path').all();
    expect(rows.results).toEqual([
      { path: 'DCSWorld/existing.lua', updated_at: now - 1000 },
      { path: 'DCSWorld/not-in-git.lua', updated_at: now - 1000 },
      { path: 'UserMissions/keep.lua', updated_at: 456 },
    ]);
    expect((await new TreePathUpdatedAtService(env.TREE_METADATA_DB).read())['DCSWorld/existing.lua']?.toISOString()).toBe(
      time,
    );
  });

  it('accepts 1000 entries and both inclusive time boundaries', async () => {
    const body = Array.from({ length: 1000 }, (_, i) =>
      entry(`DCSWorld/${i}.lua`, new Date(now - (i % 2) * 3600000).toISOString()),
    );
    const response = await request(body, `Bearer ${await token()}`);
    expect(response.status).toBe(200);
    expect(await expectV2Contract(response, 'upsertTreeMetadata')).toEqual({ updatedCount: 1000 });
    expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(1000);
  });

  it.each([undefined, 'Basic abc', 'Bearer', 'Bearer invalid.jwt.token', 'Bearer a.b.c extra'])(
    'rejects invalid authorization: %s',
    async (authorization) => {
      await expectProblem(await request([entry()], authorization), 401, 'UNAUTHENTICATED');
      expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
    },
  );

  it.each([
    ['signature', {}],
    ['issuer', { iss: 'https://attacker.example' }],
    ['audience', { aud: 'other' }],
    ['expired', { exp: Math.floor(now / 1000) - 60 }],
    ['missing exp', { exp: undefined }],
    ['missing jti', { jti: undefined }],
    ['empty jti', { jti: '' }],
  ])('rejects invalid token %s without writing or consuming jti', async (kind, overrides) => {
    const jwt = await token(overrides, kind === 'signature' ? otherKeys.privateKey : keys.privateKey);
    await expectProblem(await request([entry()], `Bearer ${jwt}`), 401, 'UNAUTHENTICATED');
    expect(await rowCount(env.JWT_REPLAY_DB, 'used_jti')).toBe(0);
    expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
  });

  it.each(Object.keys(claims))('rejects mismatched expected claim %s', async (claim) => {
    await expectProblem(await request([entry()], `Bearer ${await token({ [claim]: 'unexpected' })}`), 403, 'FORBIDDEN');
    expect(await rowCount(env.JWT_REPLAY_DB, 'used_jti')).toBe(0);
    expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
  });

  it('atomically rejects concurrent replays', async () => {
    const jwt = await token();
    const responses = await Promise.all([request([entry()], `Bearer ${jwt}`), request([entry()], `Bearer ${jwt}`)]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    for (const response of responses) {
      if (response.status === 409) await expectProblem(response, 409, 'REPLAY_DETECTED');
      else await expectV2Contract(response, 'upsertTreeMetadata');
    }
    expect(await rowCount(env.JWT_REPLAY_DB, 'used_jti')).toBe(1);
  });

  it.each(['legacy-first', 'v2-first'])('shares consumed tokens with the unchanged legacy endpoint: %s', async (order) => {
    const jwt = await token();
    const legacy = async (): Promise<Response> =>
      worker.fetch(
        new Request('https://example.com/tree-metadata/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
          body: JSON.stringify([{ path: 'DCSWorld/legacy.lua', updatedAt: now }]),
        }),
        bindings(),
      );
    if (order === 'legacy-first') {
      const response = await legacy();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: null });
      await expectProblem(await request([entry()], `Bearer ${jwt}`), 409, 'REPLAY_DETECTED');
    } else {
      expect((await request([entry()], `Bearer ${jwt}`)).status).toBe(200);
      const response = await legacy();
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ success: false, data: null });
    }
  });

  it.each(
    [
      {},
      [],
      [entry('DCSWorld/a.lua', 'invalid')],
      [{ path: 'DCSWorld/a.lua' }],
      [{ updatedAt: new Date(now).toISOString() }],
      [entry('DCSWorld/a.lua'), entry('DCSWorld/a.lua')],
      [entry('README.md')],
      [entry('DCSWorld/../a.lua')],
      [entry('DCSWorld//a.lua')],
      [entry('DCSWorld/.gitconfig')],
      [entry('DCSWorld/a\\b')],
      [entry('DCSWorld/\u0000a')],
      [entry(`DCSWorld/${'あ'.repeat(1363)}`)],
      [entry('DCSWorld/future.lua', new Date(now + 1).toISOString())],
      [entry('DCSWorld/old.lua', new Date(now - 3600001).toISOString())],
      Array.from({ length: 1001 }, (_, i) => entry(`DCSWorld/${i}.lua`)),
    ].map((body) => [body]),
  )('rejects invalid input %# without metadata writes', async (body) => {
    await expectProblem(await request(body, `Bearer ${await token()}`), 400, 'INVALID_REQUEST');
    expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
  });

  it.each([
    ['missing body', undefined, 'application/json', 400],
    ['malformed JSON', '{', 'application/json', 400],
    ['non-JSON media', '[]', 'text/plain', 415],
    ['unacceptable response', '[]', 'application/json', 406],
  ] as const)('returns contract errors for %s', async (kind, body, contentType, status) => {
    const response = await worker.fetch(
      new Request('https://example.com/v2/tree-metadata', {
        method: 'PATCH',
        headers: {
          'Content-Type': contentType,
          Authorization: `Bearer ${await token()}`,
          ...(kind === 'unacceptable response' ? { Accept: 'text/html' } : {}),
        },
        body,
      }),
      bindings(),
    );
    expect(response.status).toBe(status);
    await expectV2Contract(response, 'upsertTreeMetadata');
    expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
  });

  it('fails closed on replay database errors without treating them as bad credentials', async () => {
    await env.JWT_REPLAY_DB.exec('ALTER TABLE used_jti RENAME TO used_jti_unavailable');
    try {
      await expectProblem(await request([entry()], `Bearer ${await token()}`), 500, 'INTERNAL_ERROR');
      expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
    } finally {
      await env.JWT_REPLAY_DB.exec('ALTER TABLE used_jti_unavailable RENAME TO used_jti');
    }
  });

  it('keeps the token consumed after semantic validation failure', async () => {
    const jwt = await token();
    await expectProblem(await request([entry('README.md')], `Bearer ${jwt}`), 400, 'INVALID_REQUEST');
    await expectProblem(await request([entry()], `Bearer ${jwt}`), 409, 'REPLAY_DETECTED');
  });

  it('rolls back every entry on a late database failure and keeps the token consumed', async () => {
    await new TreePathUpdatedAtService(env.TREE_METADATA_DB).upsert([{ path: 'DCSWorld/0.lua', updatedAt: 123 }]);
    await env.TREE_METADATA_DB.exec(
      "CREATE TRIGGER fail_metadata BEFORE INSERT ON tree_path_updated_at WHEN NEW.path = 'DCSWorld/50.lua' BEGIN SELECT RAISE(ABORT, 'private DB failure'); END",
    );
    const jwt = await token();
    const body = Array.from({ length: 51 }, (_, i) => entry(`DCSWorld/${i}.lua`));
    await expectProblem(await request(body, `Bearer ${jwt}`), 500, 'INTERNAL_ERROR');
    expect((await env.TREE_METADATA_DB.prepare('SELECT path, updated_at FROM tree_path_updated_at').all()).results).toEqual([
      { path: 'DCSWorld/0.lua', updated_at: 123 },
    ]);
    await expectProblem(await request(body, `Bearer ${jwt}`), 409, 'REPLAY_DETECTED');
  });

  it.each(['TREE_METADATA_DB', 'JWT_REPLAY_DB', 'TREE_METADATA_OIDC_SUBJECT'] as const)(
    'fails closed if %s is missing',
    async (binding) => {
      await expectProblem(await request([entry()], `Bearer ${await token()}`, { [binding]: undefined }), 500, 'INTERNAL_ERROR');
      expect(await rowCount(env.TREE_METADATA_DB, 'tree_path_updated_at')).toBe(0);
    },
  );

  it('does not consume public write quota, even when that quota is exhausted', async () => {
    const publicWrite = async (): Promise<Response> =>
      worker.fetch(
        new Request('https://example.com/v2/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
          body: '{}',
        }),
        bindings(),
      );
    for (let i = 0; i < 11; i++) expect((await request([entry()], `Bearer ${await token()}`)).status).toBe(200);
    expect(await rowCount(env.TREE_METADATA_DB, 'v2_write_attempts')).toBe(0);
    for (let i = 0; i < 10; i++) expect((await publicWrite()).status).toBe(400);
    expect((await publicWrite()).status).toBe(429);
    expect((await request([entry()], `Bearer ${await token()}`)).status).toBe(200);
    expect(await rowCount(env.TREE_METADATA_DB, 'v2_write_attempts')).toBe(10);
  });
});
