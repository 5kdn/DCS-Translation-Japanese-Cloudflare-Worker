import { describe, expect, it, vi } from 'vitest';
import proxy from '@/apiProxy';

describe('API URL proxy', () => {
  it('URL・メソッド・認証・本文を変更せず、レスポンスをそのまま返す', async () => {
    const request = new Request('https://api.dcs-translation-japanese.workers.dev/tree-metadata/upsert?key=value', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', Origin: 'https://example.com', 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['test.lua'] }),
    });
    const response = new Response('streamed response', {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': 'https://example.com' },
    });
    const fetch = vi.fn().mockResolvedValue(response);

    const result = await proxy.fetch(request, { API: { fetch } });

    expect(fetch).toHaveBeenCalledExactlyOnceWith(request);
    expect(result).toBe(response);
    expect(await result.text()).toBe('streamed response');
  });
});
