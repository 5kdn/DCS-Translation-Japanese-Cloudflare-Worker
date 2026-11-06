/**
 * v2の公開応答・入力検証・共通失敗形式と、旧APIからの分離を契約検証する。
 * 後続操作の成功・失敗ケースもOAS由来の検証コードへ照合する。
 * @packageDocumentation
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it, vi } from 'vitest';
import { createV2App, registerOperation } from '@/api/v2/app';
import specification from '@/api/v2/openapi.json';
import worker from '@/index';
import { createTestBindings } from '../../helpers/environment';
import { expectV2Contract } from '../../helpers/v2Contract';

/**
 * 正式ホスト宛てのリクエストをWorkerへ直接渡す。
 * @param path クエリ文字列を含むリクエストパス。
 * @param init HTTPメソッド・ヘッダー・本文の指定。
 * @returns テスト用バインディングで処理したWorkerの実応答。
 */
const request = async (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://api.dcs-translation-japanese.workers.dev${path}`, init), createTestBindings());

describe('v2 public contracts', () => {
  it.each([
    ['/v2/health', 'getHealth'],
    ['/v2/openapi.json', 'getOpenApi'],
    ['/v2/docs', 'getDocs'],
  ] as const)('%s is public and conforms to OAS', async (path, operation) => {
    const response = await request(path);
    expect(response.status).toBe(200);
    const body = await expectV2Contract(response, operation);
    if (operation === 'getOpenApi') expect(body).toEqual(specification);
    if (operation === 'getDocs') expect(body).toContain('/v2/openapi.json');
  });

  it.each(['/v2', '/v2/', '/v2/missing', '/v2/issues', '/v2/missing?token=secret'])(
    '%s returns Problem Details',
    async (path) => {
      const response = await request(path);
      expect(response.status).toBe(404);
      expect(await expectV2Contract(response)).toMatchObject({ code: 'NOT_FOUND', instance: path.split('?')[0] });
    },
  );

  it.each([
    ['/v2/health?extra=1', {}, 400],
    ['/v2/health?__proto__=1', {}, 400],
    ['/v2/health?constructor=1', {}, 400],
    ['/v2/health?extra=1&extra=2', {}, 400],
    ['/v2/health', { headers: { Accept: 'text/html' } }, 406],
    ['/v2/health', { headers: { Accept: 'application/json;q=0, */*;q=1' } }, 406],
    ['/v2/health', { method: 'POST' }, 405],
    [`/v2/health?extra=${'a'.repeat(8192)}`, {}, 414],
  ] as const)('rejects invalid requests: %s (%s)', async (path, init, status) => {
    const response = await request(path, init);
    expect(response.status).toBe(status);
    await expectV2Contract(response, 'getHealth');
  });

  it('v2 input and auth handling do not change legacy health or 404 responses', async () => {
    const legacy = await request('/health?unknown=1', { headers: { Accept: 'text/html' } });
    expect(legacy.status).toBe(200);
    expect((await request('/missing')).headers.get('Content-Type')).toContain('text/plain');
    const v2 = await request('/v2/health', { headers: { Authorization: 'Bearer invalid-token' } });
    expect(v2.status).toBe(200);
    await expectV2Contract(v2, 'getHealth');
  });

  it('health remains public after legacy rate limiting', async () => {
    const env = createTestBindings({ DOWNLOAD_FILES_RATE_LIMIT: '1' });
    /** 同一IP・上限1回の旧APIへ送信し、v2と制限が混ざらないことを検証する。 */
    const legacy = async (): Promise<Response> =>
      worker.fetch(
        new Request('https://api.dcs-translation-japanese.workers.dev/download-file-paths', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '192.0.2.162' },
          body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
        }),
        env,
      );
    expect((await legacy()).status).toBe(200);
    expect((await legacy()).status).toBe(429);
    expect((await request('/v2/health', { headers: { 'cf-connecting-ip': '192.0.2.162' } })).status).toBe(200);
  });
});

describe('shared v2 operation pipeline', () => {
  /**
   * createIssueの入力検証だけを実行するテスト用アプリを作成する。
   * @returns GitHub操作の代わりに検証済み本文を返すアプリ。
   */
  const createApp = (): ReturnType<typeof createV2App> => {
    const app = createV2App();
    registerOperation(app, 'createIssue', (c) => c.json({ accepted: c.get('v2Input').body }));
    return app;
  };

  it.each([
    [{}, 400],
    [{ title: 123, body: 'test' }, 400],
    [{ title: 'test', body: null }, 400],
    [{ title: 'test', body: 'test', unknown: true }, 400],
    [null, 400],
  ])('rejects invalid OAS bodies %j', async (body, status) => {
    const response = await createApp().request('/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(status);
    await expectV2Contract(response, 'createIssue');
  });

  it('accepts a valid OAS body without changing it', async () => {
    const body = { title: 'test', body: 'test' };
    const response = await createApp().request('/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accepted: body });
  });

  it.each([
    ['{', 'application/json', 400],
    ['{}', 'text/plain', 415],
    ['a'.repeat(5 * 1024 * 1024 + 1), 'application/json', 413],
  ])('rejects malformed, unsupported or oversized bodies', async (body, contentType, status) => {
    const response = await createApp().request('/issues', {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body,
    });
    expect(response.status).toBe(status);
    await expectV2Contract(response, 'createIssue');
  });

  it.each([401, 403, 429, 500] as const)('normalizes thrown and returned failures: %s', async (status) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      for (const thrown of [false, true]) {
        const app = createV2App();
        app.get('/failure', (c) => {
          const headers = { 'WWW-Authenticate': 'Bearer realm="tree-metadata", error="invalid_token"', 'Retry-After': '30' };
          if (thrown) {
            if (status === 500) throw new Error('private key must not leak');
            throw new HTTPException(status, { res: new Response('private error', { status, headers }) });
          }
          return c.text('private error', status, headers);
        });
        const response = await app.request('/failure');
        expect(response.status).toBe(status);
        const body = await expectV2Contract(response);
        expect(JSON.stringify(body)).not.toContain('private');
        if (status === 401) expect(response.headers.get('WWW-Authenticate')).toContain('Bearer');
        if (status === 429) expect(response.headers.get('Retry-After')).toBe('30');
      }
    } finally {
      log.mockRestore();
    }
  });

  it('does not install the v2 error handler on the legacy parent', async () => {
    const parent = new Hono();
    parent.route('/v2', createV2App());
    expect((await parent.request('/missing')).headers.get('Content-Type')).not.toContain('application/problem+json');
  });

  it('contract checker detects missing fields, wrong status and wrong media type', async () => {
    await expect(expectV2Contract(Response.json({ status: 'ok' }), 'getHealth')).rejects.toThrow();
    await expect(
      expectV2Contract(Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { status: 201 }), 'getHealth'),
    ).rejects.toThrow();
    await expect(
      expectV2Contract(new Response('{}', { headers: { 'Content-Type': 'text/plain' } }), 'getHealth'),
    ).rejects.toThrow();
    await expect(expectV2Contract(Response.json({ status: 'ok', timestamp: 'not-a-date' }), 'getHealth')).rejects.toThrow();
  });
});
