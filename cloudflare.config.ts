import { bindings, defineConfig, defineWorker, triggers } from 'cf/config';

/**
 * 新URLで受信し、Service Binding経由で既存のAPI本体へ転送するWorkerの設定。
 * Viteの補助Workerとしてビルドし、API本体とは別にデプロイする。
 */
export const apiWorker = defineWorker({
  name: 'api',
  compatibilityDate: '2026-05-25',
  entrypoint: 'src/apiProxy.ts',
  observability: { enabled: true },
  env: {
    API: bindings.worker({ worker: 'dcs-translation-japanese-cloudflare-worker' }),
  },
});

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
      AllowOrigins: bindings.text('https://5kdn.github.io,https://dcs-translation-japanese.github.io'),
      TARGET_GH_APP_ID: bindings.text('2459818'),
      TARGET_GH_INSTALLATION_ID: bindings.text('176531154'),
      TARGET_GH_OWNER: bindings.text('dcs-translation-japanese'),
      TARGET_GH_REPO: bindings.text('translations'),
      TARGET_GH_DEFAULT_BRANCH: bindings.text('master'),
      TREE_METADATA_OIDC_SUBJECT: bindings.text('repo:dcs-translation-japanese@346855332/translations@1098927315:pull_request'),
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
