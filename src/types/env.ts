export type Bindings = {
  NODE_ENV: 'production' | 'development';
  AllowOrigins: string | undefined;
};

export type AppEnv = { Bindings: Bindings };
