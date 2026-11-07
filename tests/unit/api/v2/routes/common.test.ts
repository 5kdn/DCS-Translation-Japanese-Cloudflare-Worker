/** 共通スキーマの不正値拒否と、パス・クエリの数値変換および省略値の扱いを検証する。 */
import { describe, expect, it } from 'vitest';
import { listQuerySchema, numberParamSchema } from '@/api/v2/routes/common';

describe('v2 common schema constraints', () => {
  it.each([
    ['unknown query', listQuerySchema, { extra: '1' }, false],
    ['repeated limit', listQuerySchema, { limit: ['1', '2'] }, false],
    ['zero number', numberParamSchema, { number: '0' }, false],
  ] as const)('%s', (_name, schema, value, valid) => {
    expect(schema.safeParse(value).success).toBe(valid);
  });

  it('coerces numeric path/query values without filling optional defaults', () => {
    expect(numberParamSchema.parse({ number: '123' })).toEqual({ number: 123 });
    expect(listQuerySchema.parse({ limit: '20' })).toEqual({ limit: 20 });
    expect(listQuerySchema.parse({})).toEqual({});
  });
});
