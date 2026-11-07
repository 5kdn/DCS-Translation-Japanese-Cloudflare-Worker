import { describe, expect, it, vi } from 'vitest';
import worker from '@/index';
import { createTestBindings, env } from '../helpers/v2Write';

vi.mock('octokit', async () => (await import('../helpers/v2WriteMocks')).octokitMock);

const app = worker;

const legacyUrl = 'https://dcs-translation-japanese-cloudflare-worker.dcs-translation-japanese.workers.dev';
const currentUrl = 'https://api.dcs-translation-japanese.workers.dev';
const bindings = createTestBindings();

describe('旧URLの非推奨表示', () => {
  it('旧URLのOpenAPIを取得しても新URLのスキーマに非推奨が残らない', async () => {
    const oldResponse = await app.fetch(new Request(`${legacyUrl}/openapi.json`), bindings);
    const newResponse = await app.fetch(new Request(`${currentUrl}/openapi.json`), bindings);
    const oldDocument = await oldResponse.json<{ info: { description: string }; paths: Record<string, unknown> }>();
    const newDocument = await newResponse.json<{ info: { description?: string }; paths: Record<string, unknown> }>();
    expect(oldDocument.info.description).toContain(currentUrl);
    expect(oldDocument.info.description).toContain('2027年12月31日23:59:59（日本時間）');
    expect(newDocument.info.description).toBeUndefined();
    const normalized = JSON.parse(
      JSON.stringify(oldDocument.paths, (key, value) => (key === 'deprecated' ? undefined : value)),
    );
    expect(normalized).toEqual(newDocument.paths);
  });

  it.each(['/missing', '/tree-metadata/upsert'])('旧URLのエラー応答にも非推奨を示す: %s', async (path) => {
    const response = await app.fetch(
      new Request(
        `${legacyUrl}${path}`,
        path === '/missing'
          ? { method: 'GET' }
          : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '[]' },
      ),
      bindings,
    );
    expect(response.status).toBe(path === '/missing' ? 404 : 401);
    expect(response.headers.get('Deprecation')).toBe('@1793923200');
    expect(response.headers.get('Sunset')).toBe('Fri, 31 Dec 2027 14:59:59 GMT');
  });

  it.each(['http://localhost', `${legacyUrl}.example.com`])('旧URL以外には非推奨を示さない: %s', async (baseUrl) => {
    const response = await app.fetch(new Request(`${baseUrl}/health`), bindings);
    expect(response.status).toBe(200);
    expect(response.headers.has('Deprecation')).toBe(false);
    expect(response.headers.has('Sunset')).toBe(false);
  });
});

describe('openapi.json', () => {
  it('OpenAPIスキーマをスナップショット検証する', async () => {
    const env = createTestBindings();

    const response = await app.fetch(new Request('http://localhost/openapi.json', { method: 'GET' }), env);
    expect(response.status).toBe(200);
    const doc = await response.json();
    expect(doc).toMatchSnapshot({
      info: {
        version: expect.any(String),
      },
    });
  });
});

describe('Worker CORS', () => {
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
});
