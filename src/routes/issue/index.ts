import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/types/env';
import { registerIssueCreateRoutes } from './create';
import { registerIssueListRoutes } from './list';

export const issueRoutes = new OpenAPIHono<AppEnv>();

/** Create */
registerIssueCreateRoutes(issueRoutes);

/** List */
registerIssueListRoutes(issueRoutes);
