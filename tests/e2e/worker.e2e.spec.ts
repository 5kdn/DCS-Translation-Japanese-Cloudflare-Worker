import { SELF } from 'cloudflare:test';
import { describe, it } from 'vitest';

describe('Worker e2e', () => {
  it('GET /health で稼働状態を返す', async () => {
    const response = await SELF.fetch('http://example.com/health');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const body = await response.json<{ status: 'ok'; timestamp: string }>();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  it('GET /openapi.json で OpenAPI スキーマを返す', async () => {
    const response = await SELF.fetch('http://example.com/openapi.json');

    expect(response.status).toBe(200);

    const body = await response.json<{
      info: {
        title: string;
        version: string;
      };
    }>();
    expect(body.info.title).toBe('DCS Translation Japanese API');
    expect(body.info.version).toMatch(/\d+\.\d+\.\d+/);
  });

  it('POST /tree-metadata/upsert は Authorization ヘッダ未指定で 401 を返す', async () => {
    const response = await SELF.fetch('http://example.com/tree-metadata/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([]),
    });

    expect(response.status).toBe(401);

    const body = await response.json<{
      success: false;
      data: null;
      message: string;
    }>();
    expect(body).toEqual({
      success: false,
      data: null,
      message: 'Authorization ヘッダに有効な Bearer 形式の JWS(JWT) を指定してください。',
    });
  });
});
