import { unzipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepositoryPathNotFoundError } from '@/errors/repositoryPathNotFoundError';
import app from '@/index';
import { fetchRepositoryFile } from '@/services/githubService';
import type { AppEnv } from '@/types/env';

vi.mock('@/services/githubService', () => ({
  fetchRepositoryFile: vi.fn(),
}));

const mockedFetchRepositoryFile = vi.mocked(fetchRepositoryFile);

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
  TARGET_GH_SECRET: 'test-token',
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'main',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
});

const encode = (input: string): Uint8Array => new TextEncoder().encode(input);

describe('POST /download-files', () => {
  beforeEach(() => {
    mockedFetchRepositoryFile.mockReset();
  });

  it('正常にZIPストリームを返却する', async () => {
    const env = createEnv();
    mockedFetchRepositoryFile.mockImplementationOnce(async (ctx, path) => {
      expect(ctx.owner).toBe(env.TARGET_GH_OWNER);
      expect(ctx.repo).toBe(env.TARGET_GH_REPO);
      expect(ctx.defaultBranch).toBe('main');
      if (path === 'DCSWorld/Mods/A/file1.lua') {
        const content = encode('print("hello")\n');
        return { path, size: content.length, sha: 'sha-file1', content };
      }
      throw new Error(`unexpected path ${path}`);
    });
    mockedFetchRepositoryFile.mockImplementationOnce(async (_, path) => {
      if (path === 'DCSWorld/Mods/A/file2.lua') {
        const content = encode('return true\n');
        return { path, size: content.length, sha: 'sha-file2', content };
      }
      throw new Error(`unexpected path ${path}`);
    });

    const response = await app.request(
      'http://localhost/download-files',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.1',
        },
        body: JSON.stringify({ paths: ['DCSWorld/Mods/A/file1.lua', './DCSWorld/Mods/A/file2.lua'] }),
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('X-File-Count')).toBe('2');
    expect(response.headers.get('X-Total-Bytes')).toBe(String('print("hello")\n'.length + 'return true\n'.length));
    const etag = response.headers.get('ETag');
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);

    const zipped = new Uint8Array(await response.arrayBuffer());
    const files = unzipSync(zipped);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['DCSWorld/Mods/A/file1.lua', 'DCSWorld/Mods/A/file2.lua', 'manifest.json']),
    );
    expect(new TextDecoder().decode(files['DCSWorld/Mods/A/file1.lua'])).toBe('print("hello")\n');
    expect(new TextDecoder().decode(files['DCSWorld/Mods/A/file2.lua'])).toBe('return true\n');
    const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json']));
    expect(manifest.files).toEqual([
      expect.objectContaining({ path: 'DCSWorld/Mods/A/file1.lua' }),
      expect.objectContaining({ path: 'DCSWorld/Mods/A/file2.lua' }),
    ]);
  });

  it('ETagが一致する場合に304を返却する', async () => {
    const env = createEnv();
    mockedFetchRepositoryFile.mockResolvedValue({
      path: 'DCSWorld/file.lua',
      size: 4,
      sha: 'sha-file',
      content: encode('test'),
    });

    const first = await app.request(
      'http://localhost/download-files',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.2',
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
      },
      env,
    );
    const etag = first.headers.get('ETag');
    expect(etag).toBeTruthy();

    mockedFetchRepositoryFile.mockResolvedValue({
      path: 'DCSWorld/file.lua',
      size: 4,
      sha: 'sha-file',
      content: encode('test'),
    });

    const second = await app.request(
      'http://localhost/download-files',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.2',
          'If-None-Match': etag ?? '',
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
      },
      env,
    );

    expect(second.status).toBe(304);
    expect(second.headers.get('ETag')).toBe(etag);
    expect(second.headers.get('X-File-Count')).toBe('1');
  });

  it('重複パスで400を返却する', async () => {
    const env = createEnv();
    const response = await app.request(
      'http://localhost/download-files',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.3',
        },
        body: JSON.stringify({ paths: ['DCSWorld/file.lua', 'DCSWorld/file.lua'] }),
      },
      env,
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors?.['paths[1]']?.[0]).toMatch('重複');
  });

  it('GitHubから取得できない場合に422を返却する', async () => {
    const env = createEnv();
    mockedFetchRepositoryFile.mockRejectedValue(new RepositoryPathNotFoundError('not found'));

    const response = await app.request(
      'http://localhost/download-files',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '10.0.0.4',
        },
        body: JSON.stringify({ paths: ['DCSWorld/missing.lua'] }),
      },
      env,
    );

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors?.['paths[0]']?.[0]).toMatch('見つかりません');
  });

  it('一定回数を超えると429を返却する', async () => {
    const env = createEnv();
    mockedFetchRepositoryFile.mockResolvedValue({
      path: 'DCSWorld/file.lua',
      size: 4,
      sha: 'sha-file',
      content: encode('test'),
    });

    let lastResponse: Response | undefined;
    for (let i = 0; i < 31; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      lastResponse = await app.request(
        'http://localhost/download-files',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-connecting-ip': '10.0.0.5',
          },
          body: JSON.stringify({ paths: ['DCSWorld/file.lua'] }),
        },
        env,
      );
      if (lastResponse.status === 429) break;
    }

    expect(lastResponse?.status).toBe(429);
    const body = lastResponse ? await lastResponse.json() : undefined;
    expect(typeof body === 'object' && body !== null && 'type' in body).toBe(true);
  });
});
