import type { Bindings } from '@/types/env';

export const createTestBindings = (overrides: Partial<Bindings> = {}): Bindings => ({
  NODE_ENV: 'development',
  AllowOrigins: '',
  TARGET_GH_APP_ID: '123456',
  TARGET_GH_APP_PRIVATE_KEY: 'test-private-key',
  TARGET_GH_INSTALLATION_ID: '987654321',
  TARGET_GH_OWNER: 'test-owner',
  TARGET_GH_REPO: 'test-repo',
  TARGET_GH_DEFAULT_BRANCH: 'main',
  DOWNLOAD_FILES_RATE_LIMIT: '30',
  ...overrides,
});
