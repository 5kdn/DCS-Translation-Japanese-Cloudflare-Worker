/** ヘルスチェックのレスポンススキーマが、不正な日時と未定義フィールドを拒否することを検証する。 */
import { describe, expect, it } from 'vitest';
import { healthSchema } from '@/api/v2/routes/health';

describe('v2 health schema constraints', () => {
  it.each([
    ['invalid health date', { status: 'ok', timestamp: 'not-a-date' }, false],
    ['unknown health field', { status: 'ok', timestamp: '2026-01-01T00:00:00Z', extra: true }, false],
  ] as const)('%s', (_name, value, valid) => {
    expect(healthSchema.safeParse(value).success).toBe(valid);
  });
});
