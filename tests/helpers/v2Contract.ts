import { type RouteConfig, z } from '@hono/zod-openapi';
import { expect } from 'vitest';
import { routes } from '@/api/v2/routes';
import { problemSchema } from '@/api/v2/routes/common';

/** 契約を照合するHonoルートの操作識別子。 */
type OperationId = keyof typeof routes;

/**
 * 実応答のstatus・Content-Type・本文をHonoルートのZodスキーマへ照合する。
 * 本文を消費するため、HEADの本文検証には使用しない。
 */
export const expectV2Contract = async (response: Response, operationId?: OperationId): Promise<unknown> => {
  const mediaType = response.headers.get('Content-Type')?.split(';')[0];
  expect(mediaType).toBeDefined();
  const body: unknown = mediaType === 'text/html' ? await response.text() : await response.json();
  let schema: z.ZodType = problemSchema;
  if (operationId) {
    const definitions: RouteConfig['responses'] = routes[operationId].responses;
    const definition = definitions[response.status] ?? (response.status >= 400 ? definitions.default : undefined);
    expect(definition, `Undocumented status ${response.status}`).toBeDefined();
    if (!definition || '$ref' in definition) throw new Error('Missing response definition');
    const media = definition.content?.[mediaType ?? ''];
    const responseSchema = media && !('$ref' in media) ? media.schema : undefined;
    expect(responseSchema, `Undocumented Content-Type ${mediaType}`).toBeInstanceOf(z.ZodType);
    if (!(responseSchema instanceof z.ZodType)) throw new Error('Missing Zod response schema');
    schema = responseSchema;
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  const result = schema.safeParse(body);
  expect(result.success, JSON.stringify(result.error)).toBe(true);
  if (response.status >= 400) {
    expect(mediaType).toBe('application/problem+json');
    expect(body).toHaveProperty('status', response.status);
  }
  return body;
};
