/** GitHub接続サービスに対する、v2固有のHTTPエラー変換を検証する。 */
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGitHubContext } from '@/api/v2/githubAdapter';
import { createTestBindings } from '../helpers/environment';

const mocks = vi.hoisted(() => ({ app: vi.fn(), authenticate: vi.fn(), octokit: {} }));
vi.mock('octokit', () => ({
  App: class {
    constructor(config: { appId: number; privateKey: string }) {
      mocks.app(config);
    }
    async getInstallationOctokit(installationId: number) {
      return mocks.authenticate(installationId);
    }
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue(mocks.octokit);
});

describe('v2 GitHub context adapter', () => {
  it('uses the service to create the same public context', async () => {
    expect(await getGitHubContext(createTestBindings())).toEqual({
      octokit: mocks.octokit,
      owner: 'test-owner',
      repo: 'test-repo',
      defaultBranch: 'main',
    });
  });

  it('leaves configuration errors outside the upstream error conversion', async () => {
    const pending = getGitHubContext(createTestBindings({ TARGET_GH_APP_ID: '' }));
    await expect(pending).rejects.toThrow('missing required env: TARGET_GH_APP_ID');
    await expect(pending).rejects.not.toBeInstanceOf(HTTPException);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: 500 }, 502],
    [{ status: 403 }, 502],
    [{ status: 429, response: { headers: { 'retry-after': '12' } } }, 503],
    [new TypeError('network failure'), 503],
  ] as const)('preserves the v2 status mapping for authentication failure %j', async (failure, status) => {
    mocks.authenticate.mockRejectedValue(failure);
    await expect(getGitHubContext(createTestBindings())).rejects.toMatchObject({ status });
  });

  it('preserves the upstream Retry-After header during authentication', async () => {
    mocks.authenticate.mockRejectedValue({ status: 429, response: { headers: { 'retry-after': '12' } } });
    try {
      await getGitHubContext(createTestBindings());
      expect.unreachable('authentication must fail');
    } catch (error) {
      expect(error).toBeInstanceOf(HTTPException);
      if (!(error instanceof HTTPException)) throw error;
      expect(error.getResponse().headers.get('Retry-After')).toBe('12');
    }
  });
});
