import { describe, expect, it } from 'vitest';
import app from '@/index';
import type { AppEnv } from '@/types/env';

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
  TARGET_GH_SECRET: 'test-token',
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'main',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
});

describe('POST /download-file-paths', () => {
  it('正常にURL一覧を返却する', async () => {
    const env = createEnv();
    const response = await app.request(
      'http://localhost/download-file-paths',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.10',
        },
        body: JSON.stringify({ paths: ['DCSWorld/Mods/A/file1.lua', 'DCSWorld/Mods/A/file2.lua'] }),
      },
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
    const first = await app.request(
      'http://localhost/download-file-paths',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.11',
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
      },
      env,
    );
    const etag = first.headers.get('ETag') ?? '';

    const second = await app.request(
      'http://localhost/download-file-paths',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.11',
          'If-None-Match': etag,
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
      },
      env,
    );

    expect(second.status).toBe(304);
    expect(second.headers.get('ETag')).toBe(etag);
    expect(second.headers.get('X-File-Count')).toBe('1');
  });

  it('不許可パスで 400 を返却する', async () => {
    const env = createEnv();
    const response = await app.request(
      'http://localhost/download-file-paths',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.12',
        },
        body: JSON.stringify({ paths: ['/secret/file'] }),
      },
      env,
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors?.['paths[0]']?.[0]).toMatch('先頭にスラッシュ');
  });
});
