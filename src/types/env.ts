export type Bindings = {
  NODE_ENV: 'production' | 'development';
  AllowOrigins: string | undefined;
  TARGET_GH_APP_ID: string;
  TARGET_GH_APP_PRIVATE_KEY: string;
  TARGET_GH_INSTALLATION_ID: string;
  TARGET_GH_OWNER: string;
  TARGET_GH_REPO: string;
  TARGET_GH_DEFAULT_BRANCH: string;
  DOWNLOAD_FILES_RATE_LIMIT: string | undefined;
  TREE_METADATA_OIDC_AUDIENCE?: string;
  TREE_METADATA_DB?: D1Database;
  JWT_REPLAY_DB?: D1Database;
};

export type AppEnv = { Bindings: Bindings };
