import { describe, expect, it } from 'vitest';
import app from '@/index';
import { createTestBindings } from '../../helpers/environment';

describe('GET /docs', () => {
  it('Swagger UI のHTMLを返す', async () => {
    const env = createTestBindings();
    const response = await app.fetch(new Request('http://localhost/docs', { method: 'GET' }), env);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const body = await response.text();
    expect(body).toContain('SwaggerUI');
    expect(body).toContain('/openapi.json');
  });
});
