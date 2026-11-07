import { describe, expect, it } from 'vitest';
import developmentApp from '@/index.dev';
import { createTestBindings } from '../helpers/environment';
import { expectV2Contract } from '../helpers/v2Contract';

const origin = 'https://dcs-translation-japanese.github.io';
const bindings = createTestBindings({ AllowOrigins: origin });

/** 開発用エントリーポイントでも旧APIのスキーマ・ルート・CORS設定を維持する。 */
describe('開発用エントリーポイント', () => {
  it.each([
    ['/v2/health', 'getHealth'],
    ['/v2/openapi.json', 'getOpenApi'],
    ['/v2/docs', 'getDocs'],
  ] as const)('%sがv2の契約どおりに応答する', async (path, operation) => {
    const response = await developmentApp.fetch(
      new Request(`http://localhost${path}`, { headers: { Origin: origin } }),
      bindings,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    await expectV2Contract(response, operation);
  });

  it('OpenAPIがローカルURLと旧APIの操作を案内する', async () => {
    const response = await developmentApp.fetch(new Request('http://localhost/openapi.json'), bindings);
    expect(response.status).toBe(200);
    const document = await response.json<{ servers: Array<{ url: string }>; paths: Record<string, unknown> }>();
    expect(document.servers[0]?.url).toBe('http://127.0.0.1:8787');
    expect(document.paths).toHaveProperty('/health');
    expect(document.paths).toHaveProperty('/download-file-paths');
    expect(document.paths).not.toHaveProperty('/v2/health');
  });

  it('healthが既存のCORS設定で応答する', async () => {
    const response = await developmentApp.fetch(
      new Request('http://localhost/health', { headers: { Origin: origin } }),
      bindings,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(response.headers.has('Access-Control-Expose-Headers')).toBe(false);
    expect(await response.json()).toMatchObject({ status: 'ok' });
  });
});
