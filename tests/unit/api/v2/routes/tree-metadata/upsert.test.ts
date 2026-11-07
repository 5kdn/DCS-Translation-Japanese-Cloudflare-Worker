/** ツリーメタデータの更新スキーマについて、日時・配列件数と更新結果の件数制約を検証する。 */
import { describe, expect, it } from 'vitest';
import { metadataResultSchema, metadataUpdateSchema } from '@/api/v2/routes/tree-metadata/upsert';

describe('v2 tree metadata schema constraints', () => {
  it.each([
    ['valid metadata', metadataUpdateSchema, [{ path: 'DCSWorld/file.lua', updatedAt: '2026-01-01T00:00:00Z' }], true],
    ['invalid metadata date', metadataUpdateSchema, [{ path: 'DCSWorld/file.lua', updatedAt: 'not-a-date' }], false],
    ['empty metadata', metadataUpdateSchema, [], false],
    ['metadata count minimum', metadataResultSchema, { updatedCount: 0 }, false],
    ['metadata count maximum', metadataResultSchema, { updatedCount: 1001 }, false],
  ] as const)('%s', (_name, schema, value, valid) => {
    expect(schema.safeParse(value).success).toBe(valid);
  });
});
