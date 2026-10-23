import { bindings, defineConfig, triggers } from 'cf/config';

export default defineConfig(({ mode }) => ({
  worker: {
    name: 'dcs-translation-japanese-cloudflare-worker',
    compatibilityDate: '2026-05-25',
    entrypoint: mode === 'development' ? 'src/index.dev.ts' : 'src/index.ts',
    observability: {
      enabled: true,
    },
    triggers: [
      triggers.scheduled({
        schedule: '0 21 11 * *',
      }),
    ],
    env: {
      NODE_ENV: bindings.text('production'),
      AllowOrigins: bindings.text('https://5kdn.github.io'),
      TARGET_GH_APP_ID: bindings.text('2459818'),
      TARGET_GH_INSTALLATION_ID: bindings.text('99269804'),
      TARGET_GH_OWNER: bindings.text('5kdn'),
      TARGET_GH_REPO: bindings.text('DCS-Translation-Japanese'),
      TARGET_GH_DEFAULT_BRANCH: bindings.text('master'),
      DOWNLOAD_FILES_RATE_LIMIT: bindings.text('500'),
      TREE_METADATA_DB: bindings.d1({
        name: 'tree-metadata-db',
        id: '912553b3-bdeb-42ee-8da1-cbb43c586bd6',
      }),
      JWT_REPLAY_DB: bindings.d1({
        name: 'jwt-replay-db',
        id: 'da5d4ee8-05a6-428c-b45d-acebfe90b05a',
      }),
    },
  },
}));
