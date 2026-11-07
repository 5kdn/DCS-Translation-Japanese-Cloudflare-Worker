/**
 * 旧download-file-pathsのURL生成・キャッシュ・既存400応答を回帰検証する。
 * v2のエラーコードや入力検証を旧APIへ波及させないことを確認する。
 * @packageDocumentation
 */
import { describe, expect, it } from 'vitest';
import app from '@/index';
import type { AppEnv } from '@/types/env';

/**
 * 外部通信を必要としない旧APIのテスト用バインディングを作成する。
 * @returns ダミーのGitHub設定と既存のダウンロード制限を含む環境。
 */
const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'main',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
  TARGET_GH_APP_ID: '123456',
  TARGET_GH_APP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxxxxxxxxxxxxxxxxxxxxxxxxx\n-----END PRIVATE KEY-----',
  TARGET_GH_INSTALLATION_ID: '987654321',
});

describe('POST /download-file-paths', () => {
  it('必須項目欠落時の既存の400応答を維持する', async () => {
    const response = await app.fetch(
      new Request('http://localhost/download-file-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
      createEnv(),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body).toMatchObject({ success: false, error: { name: 'ZodError' } });
    expect(body).not.toHaveProperty('code');
  });

  it('正常にURL一覧を返却する', async () => {
    const env = createEnv();
    const response = await app.fetch(
      new Request('http://localhost/download-file-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.10',
        },
        body: JSON.stringify({ paths: ['DCSWorld/Mods/A/file1.lua', 'DCSWorld/Mods/A/file2.lua'] }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('X-File-Count')).toBe('2');
    const etag = response.headers.get('ETag');
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);

    const body = (await response.json()) as {
      files: Array<{ path: string; url: string }>;
      etag: string;
      version: number;
    };
    expect(body.version).toBe(1);
    expect(body.etag).toBe(etag);
    expect(body.files).toHaveLength(2);
    expect(body.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'DCSWorld/Mods/A/file1.lua',
          url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/DCSWorld/Mods/A/file1.lua',
        }),
        expect.objectContaining({
          path: 'DCSWorld/Mods/A/file2.lua',
          url: 'https://raw.githubusercontent.com/test-owner/test-repo/main/DCSWorld/Mods/A/file2.lua',
        }),
      ]),
    );
  });

  it('ETag が一致する場合に 304 を返却する', async () => {
    const env = createEnv();
    const first = await app.fetch(
      new Request('http://localhost/download-file-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.11',
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
      }),
      env,
    );
    const etag = first.headers.get('ETag') ?? '';

    const second = await app.fetch(
      new Request('http://localhost/download-file-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.11',
          'If-None-Match': etag,
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
      }),
      env,
    );

    expect(second.status).toBe(304);
    expect(second.headers.get('ETag')).toBe(etag);
    expect(second.headers.get('X-File-Count')).toBe('1');
  });

  it('不許可パスで 400 を返却する', async () => {
    const env = createEnv();
    const response = await app.fetch(
      new Request('http://localhost/download-file-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.12',
        },
        body: JSON.stringify({ paths: ['/secret/file'] }),
      }),
      env,
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body).toMatchObject({
      type: 'https://dcs-translation-japanese.workers.dev/problem/validation',
      title: 'Bad Request',
      status: 400,
      detail: '入力の検証に失敗しました。',
      instance: '/download-file-paths',
    });
    expect(body).not.toHaveProperty('code');
    expect(body.errors?.['paths[0]']?.[0]).toMatch('先頭にスラッシュ');
  });
});
