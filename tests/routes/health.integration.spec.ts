import { describe, expect, it } from 'vitest';
import app from '@/index';
import type { AppEnv } from '@/types/env';

const createEnv = (): AppEnv['Bindings'] => ({
  NODE_ENV: 'development',
  AllowOrigins: undefined,
});

describe('GET /health', () => {
  it('稼働状態を返す', async () => {
    const env = createEnv();
    const response = await app.request('http://localhost/health', { method: 'GET' }, env);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json<{ status: 'ok'; timestamp: string }>();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});
