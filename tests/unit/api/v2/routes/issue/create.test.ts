/** Issue作成スキーマの入力制約と、本文の型変換や省略値の補完を行わないことを検証する。 */
import { describe, expect, it } from 'vitest';
import { issueCreateSchema } from '@/api/v2/routes/issue/create';

describe('v2 issue creation schema constraints', () => {
  it.each([
    ['issue title only', { title: 'test' }, true],
    ['empty title', { title: '' }, false],
    ['long title', { title: 'a'.repeat(257) }, false],
    ['unknown issue field', { title: 'test', extra: 1 }, false],
    ['duplicate labels', { title: 'test', labels: ['bug', 'bug'] }, false],
    ['duplicate assignees', { title: 'test', assignees: ['user', 'user'] }, false],
  ] as const)('%s', (_name, value, valid) => {
    expect(issueCreateSchema.safeParse(value).success).toBe(valid);
  });

  it('does not coerce body values or fill optional defaults', () => {
    const body = { title: 'test' };
    expect(issueCreateSchema.parse(body)).toEqual(body);
    expect(issueCreateSchema.safeParse({ title: 123 }).success).toBe(false);
  });
});
