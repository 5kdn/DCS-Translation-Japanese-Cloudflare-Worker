import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { upsertTreeMetadata, upsertTreeMetadataHandler } from './upsert';

export const treeMetadataRoutes = {
  upsertTreeMetadata,
};

/** OIDC限定のメタデータ一括更新操作をv2に登録する。 */
export const registerTreeMetadataRoutes = (app: OpenAPIHono<AppEnv>): void => {
  app.openapi(upsertTreeMetadata, upsertTreeMetadataHandler);
};
