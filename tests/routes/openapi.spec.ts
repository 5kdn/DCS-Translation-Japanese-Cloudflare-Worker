import { describe, expect, it } from 'vitest';
import app from '@/index';
import type { AppEnv } from '@/types/env';

describe('openapi.json', () => {
  it('OpenAPIスキーマをスナップショット検証する', async () => {
    const env: AppEnv['Bindings'] = {
      NODE_ENV: 'development',
      AllowOrigins: '',
    };

    const response = await app.request('http://localhost/openapi.json', { method: 'GET' }, env);
    expect(response.status).toBe(200);
    const doc = await response.json();
    expect(doc).toMatchSnapshot({
      info: {
        version: expect.any(String),
      },
    });
  });
});
