/** GitHub接続サービスの設定検証・認証処理・エラー伝播を検証する。 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGitHubContext, getGitHubConfig } from '@/services/githubService/context';
import { createTestBindings } from '../../../helpers/environment';

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

describe('GitHub context service', () => {
  it('validates configuration before connecting and creates an installation-authenticated context', async () => {
    const config = getGitHubConfig(createTestBindings({ TARGET_GH_DEFAULT_BRANCH: ' feature/base ' }));
    expect(config).toEqual({
      appId: 123456,
      privateKey: 'test-private-key',
      installationId: 987654321,
      owner: 'test-owner',
      repo: 'test-repo',
      defaultBranch: 'feature/base',
    });
    expect(mocks.app).not.toHaveBeenCalled();
    expect(await createGitHubContext(config)).toEqual({
      octokit: mocks.octokit,
      owner: 'test-owner',
      repo: 'test-repo',
      defaultBranch: 'feature/base',
    });
    expect(mocks.app).toHaveBeenCalledWith({ appId: 123456, privateKey: 'test-private-key' });
    expect(mocks.authenticate).toHaveBeenCalledWith(987654321);
  });

  it.each(['', undefined])('defaults an unset or empty branch to master: %s', (branch) => {
    expect(getGitHubConfig(createTestBindings({ TARGET_GH_DEFAULT_BRANCH: branch })).defaultBranch).toBe('master');
  });

  it.each([
    'TARGET_GH_APP_ID',
    'TARGET_GH_APP_PRIVATE_KEY',
    'TARGET_GH_INSTALLATION_ID',
    'TARGET_GH_OWNER',
    'TARGET_GH_REPO',
  ] as const)('rejects missing %s without attempting authentication', (key) => {
    expect(() => getGitHubConfig(createTestBindings({ [key]: ' ' }))).toThrow(`missing required env: ${key}`);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it.each(['TARGET_GH_APP_ID', 'TARGET_GH_INSTALLATION_ID'] as const)('rejects non-numeric %s', (key) => {
    expect(() => getGitHubConfig(createTestBindings({ [key]: 'not-a-number' }))).toThrow(`invalid number env: ${key}`);
  });

  it('propagates SDK authentication errors unchanged instead of converting them to HTTP errors', async () => {
    const failure = { status: 429, message: 'upstream error', response: { headers: { 'retry-after': '12' } } };
    mocks.authenticate.mockRejectedValue(failure);
    await expect(createGitHubContext(getGitHubConfig(createTestBindings()))).rejects.toBe(failure);
  });
});
