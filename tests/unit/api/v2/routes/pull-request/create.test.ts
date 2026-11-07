/** PR作成スキーマのファイル操作制約と、作成結果のコミットSHA検証を確認する。 */
import { describe, expect, it } from 'vitest';
import { pullRequestCreateSchema, pullRequestCreationSchema } from '@/api/v2/routes/pull-request/create';

const validPullRequest = { prTitle: 'test', branchName: 'translation', files: [{ path: 'DCSWorld/file.lua', content: '' }] };

describe('v2 pull request creation schema constraints', () => {
  it.each([
    ['empty file content', pullRequestCreateSchema, validPullRequest, true],
    [
      'delete file',
      pullRequestCreateSchema,
      { ...validPullRequest, files: [{ path: 'DCSWorld/file.lua', operation: 'delete' }] },
      true,
    ],
    [
      'delete with content',
      pullRequestCreateSchema,
      { ...validPullRequest, files: [{ path: 'DCSWorld/file.lua', operation: 'delete', content: '' }] },
      false,
    ],
    ['no files', pullRequestCreateSchema, { ...validPullRequest, files: [] }, false],
    [
      'invalid commit SHA',
      pullRequestCreationSchema,
      { number: 1, url: 'https://example.com', branchName: 'test', commitSha: 'wrong', reused: false },
      false,
    ],
  ] as const)('%s', (_name, schema, value, valid) => {
    expect(schema.safeParse(value).success).toBe(valid);
  });
});
