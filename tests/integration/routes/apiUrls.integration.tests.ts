import { beforeEach, describe, expect, it, vi } from 'vitest';
import proxy from '@/apiProxy';
import app from '@/index';
import developmentApp from '@/index.dev';
import { createIssue, getIssues } from '@/services/githubService';
import { createTestBindings } from '../../helpers/environment';
import { expectV2Contract } from '../../helpers/v2Contract';

vi.mock('@/services/githubService', () => ({
  createIssue: vi.fn(),
  getIssues: vi.fn(),
}));

const origin = 'https://dcs-translation-japanese.github.io';
const bindings = createTestBindings({ AllowOrigins: origin });

/**
 * 転送先のService Bindingを再現し、テスト用BindingsでAPI本体を実行する。
 * GitHubとの通信だけをモックし、新旧URLで同じルーターの動作を検証する。
 */
const api = { fetch: async (input: RequestInfo | URL, init?: RequestInit) => app.fetch(new Request(input, init), bindings) };

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

describe.each([
  ['新URL', 'https://api.dcs-translation-japanese.workers.dev', (request: Request) => proxy.fetch(request, { API: api })],
  [
    '旧URL',
    'https://dcs-translation-japanese-cloudflare-worker.dcs-translation-japanese.workers.dev',
    (request: Request) => app.fetch(request, bindings),
  ],
] as const)('%s', (label, baseUrl, fetch) => {
  const legacy = label === '旧URL';
  beforeEach(() => vi.clearAllMocks());

  it('healthがリダイレクトせず直接応答する', async () => {
    const response = await fetch(new Request(`${baseUrl}/health`));
    expect(response.status).toBe(200);
    expect(response.headers.has('location')).toBe(false);
    expect(response.headers.get('Deprecation')).toBe(legacy ? '@1793923200' : null);
    expect(response.headers.get('Sunset')).toBe(legacy ? 'Fri, 31 Dec 2027 14:59:59 GMT' : null);
    expect(await response.json()).toMatchObject({ status: 'ok' });
  });

  it('OpenAPIが正式URLを案内する', async () => {
    const response = await fetch(new Request(`${baseUrl}/openapi.json`));
    expect(response.status).toBe(200);
    expect(response.headers.has('location')).toBe(false);
    const document = await response.json<{
      paths: Record<string, Record<string, { deprecated?: boolean; responses?: unknown }>>;
    }>();
    expect(document).toMatchObject({
      servers: [{ url: 'https://api.dcs-translation-japanese.workers.dev' }],
    });
    const operations = Object.values(document.paths ?? {}).flatMap((path) =>
      Object.values(path ?? {}).filter((value) => typeof value === 'object' && value !== null && 'responses' in value),
    );
    expect(operations.length).toBeGreaterThan(0);
    for (const operation of operations) {
      if (legacy) expect(operation).toHaveProperty('deprecated', true);
      else expect(operation).not.toHaveProperty('deprecated', true);
    }
  });

  it('OpenAPIのGETは既存どおりCORS処理より先に応答する', async () => {
    const response = await fetch(new Request(`${baseUrl}/openapi.json`, { headers: { Origin: origin } }));
    expect(response.status).toBe(200);
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect(response.headers.get('Deprecation')).toBe(legacy ? '@1793923200' : null);
  });

  it('Swagger UIでも同じOpenAPIを使用し、非推奨ヘッダーを返す', async () => {
    const response = await fetch(new Request(`${baseUrl}/docs`));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('/openapi.json');
    expect(response.headers.get('Deprecation')).toBe(legacy ? '@1793923200' : null);
  });

  it('ブラウザーから非推奨ヘッダーを参照できる', async () => {
    const response = await fetch(new Request(`${baseUrl}/health`, { headers: { Origin: origin } }));
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    if (legacy) {
      expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Deprecation');
      expect(response.headers.get('Access-Control-Expose-Headers')).toContain('Sunset');
    }
    expect(response.headers.get('Sunset')).toBe(legacy ? 'Fri, 31 Dec 2027 14:59:59 GMT' : null);
    expect(response.headers.get('Deprecation')).toBe(legacy ? '@1793923200' : null);
  });

  it('取得系APIが同じGitHubデータを返す', async () => {
    vi.mocked(getIssues).mockResolvedValueOnce([]);
    const response = await fetch(new Request(`${baseUrl}/issue/list?state=all`, { method: 'POST' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [] });
    expect(vi.mocked(getIssues).mock.calls[0]?.[0]).toMatchObject({
      owner: bindings.TARGET_GH_OWNER,
      repo: bindings.TARGET_GH_REPO,
    });
    expect(vi.mocked(getIssues).mock.calls[0]?.[1]).toEqual({ state: 'all' });
  });

  it('更新系APIが本文を受け取り同じリポジトリを操作する', async () => {
    const payload = { title: 'URL migration test', body: 'test body' };
    vi.mocked(createIssue).mockResolvedValueOnce({
      issueNumber: 159,
      issueUrl: 'https://github.com/test-owner/test-repo/issues/159',
    });
    const response = await fetch(
      new Request(`${baseUrl}/issue/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: [{ issueNumber: 159 }] });
    expect(vi.mocked(createIssue).mock.calls[0]?.[0]).toMatchObject(payload);
    expect(vi.mocked(createIssue).mock.calls[0]?.[1]).toMatchObject({
      owner: bindings.TARGET_GH_OWNER,
      repo: bindings.TARGET_GH_REPO,
    });
  });

  it.each([undefined, 'Bearer invalid-token'])('認証不備を拒否する: %s', async (authorization) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authorization) headers.Authorization = authorization;
    const response = await fetch(
      new Request(`${baseUrl}/tree-metadata/upsert`, {
        method: 'POST',
        headers,
        body: JSON.stringify([]),
      }),
    );
    expect(response.status).toBe(401);
    expect(response.headers.get('Deprecation')).toBe(legacy ? '@1793923200' : null);
  });

  it.each([origin, 'https://untrusted.example'])('CORSを同じ条件で処理する: %s', async (requestOrigin) => {
    const response = await fetch(
      new Request(`${baseUrl}/tree-metadata/upsert`, {
        method: 'OPTIONS',
        headers: {
          Origin: requestOrigin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
        },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(requestOrigin === origin ? origin : null);
    if (requestOrigin === origin) {
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    }
  });
});
