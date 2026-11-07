/** Issue更新スキーマが空の更新とnullの本文を拒否し、空文字による本文の消去を許可することを検証する。 */
import { describe, expect, it } from 'vitest';
import { issueUpdateSchema } from '@/api/v2/routes/issue/update';

describe('v2 issue update schema constraints', () => {
  it.each([
    ['empty update', {}, false],
    ['clear body', { body: '' }, true],
    ['null update body', { body: null }, false],
  ] as const)('%s', (_name, value, valid) => {
    expect(issueUpdateSchema.safeParse(value).success).toBe(valid);
  });
});
