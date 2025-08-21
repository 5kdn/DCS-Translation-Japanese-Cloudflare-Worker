export type Bindings = {
  NODE_ENV: 'production' | 'development';
  AllowOrigins: string | undefined;
  TARGET_GH_SECRET: string;
  TARGET_GH_OWNER: string;
  TARGET_GH_REPO: string;
  TARGET_GH_DEFAULT_BRANCH: string;
  DOWNLOAD_FILES_RATE_LIMIT: string | undefined;
};

export type AppEnv = { Bindings: Bindings };
