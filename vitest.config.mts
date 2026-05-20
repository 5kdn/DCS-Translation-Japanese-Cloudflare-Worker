import path from 'node:path';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.toml' } })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    typecheck: {
      tsconfig: './tests/tsconfig.json',
    },
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.integration.tests.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.spec.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
});
