import { describe, expect, it } from 'vitest';
import app from '@/index';
import { createTestBindings } from '../../helpers/environment';

describe('openapi.json', () => {
  it('OpenAPIスキーマをスナップショット検証する', async () => {
    const env = createTestBindings();

    const response = await app.fetch(new Request('http://localhost/openapi.json', { method: 'GET' }), env);
    expect(response.status).toBe(200);
    const doc = await response.json();
    expect(doc).toMatchSnapshot({
      info: {
        version: expect.any(String),
      },
    });
  });
});
