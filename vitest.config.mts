import path from 'node:path';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.json',
    },
    environment: 'node',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
