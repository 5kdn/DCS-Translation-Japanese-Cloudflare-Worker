import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { registerTreeRootRoutes } from './root';

export const treeRoutes = new OpenAPIHono<AppEnv>();

registerTreeRootRoutes(treeRoutes);
