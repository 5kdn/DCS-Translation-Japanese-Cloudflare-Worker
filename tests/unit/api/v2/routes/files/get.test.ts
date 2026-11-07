/** ファイル取得クエリが単一・複数パスを受け付け、重複パスを拒否することを検証する。 */
import { describe, expect, it } from 'vitest';
import { filesQuerySchema } from '@/api/v2/routes/files/get';

describe('v2 files query schema constraints', () => {
  it.each([
    ['single file query', { path: 'DCSWorld/file.lua' }, true],
    ['multiple file query', { path: ['DCSWorld/a.lua', 'DCSWorld/b.lua'] }, true],
    ['duplicate file query', { path: ['DCSWorld/a.lua', 'DCSWorld/a.lua'] }, false],
  ] as const)('%s', (_name, value, valid) => {
    expect(filesQuerySchema.safeParse(value).success).toBe(valid);
  });
});
