import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { registerTreeMetadataUpsertRoutes } from './upsert';

export const treeMetadataRoutes = new OpenAPIHono<AppEnv>();

/** Upsert */
registerTreeMetadataUpsertRoutes(treeMetadataRoutes);
