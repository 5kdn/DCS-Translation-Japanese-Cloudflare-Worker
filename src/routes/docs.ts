import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import type { AppEnv } from '@/types/env';

const r = new Hono<AppEnv>();

// Swagger UI
r.get('/docs', swaggerUI({ url: '/openapi.json' }));

export default r;
