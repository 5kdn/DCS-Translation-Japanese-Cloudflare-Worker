import { describe, expect, it } from 'vitest';
import app from '@/index';
import { createTestBindings } from '../../helpers/environment';

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
