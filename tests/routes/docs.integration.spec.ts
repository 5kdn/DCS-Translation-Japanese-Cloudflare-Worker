import { describe, expect, it } from 'vitest';
import app from '@/index';
import type { AppEnv } from '@/types/env';

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: '',
});

describe('GET /docs', () => {
  it('Swagger UI のHTMLを返す', async () => {
    const env = createEnv();
    const response = await app.request('http://localhost/docs', { method: 'GET' }, env);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('SwaggerUI');
    expect(body).toContain('/openapi.json');
  });
});
