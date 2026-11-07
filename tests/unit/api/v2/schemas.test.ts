import { describe, expect, it } from 'vitest';
import { listQuerySchema, numberParamSchema } from '@/api/v2/routes/common';
import { filesQuerySchema } from '@/api/v2/routes/files/get';
import { healthSchema } from '@/api/v2/routes/health';
import { issueCreateSchema } from '@/api/v2/routes/issue/create';
import { issueUpdateSchema } from '@/api/v2/routes/issue/update';
import { pullRequestCreateSchema, pullRequestCreationSchema } from '@/api/v2/routes/pull-request/create';
import { metadataResultSchema, metadataUpdateSchema } from '@/api/v2/routes/tree-metadata/upsert';

const validPullRequest = { prTitle: 'test', branchName: 'translation', files: [{ path: 'DCSWorld/file.lua', content: '' }] };

describe('v2 Zod request and response constraints', () => {
  it.each([
    ['issue title only', issueCreateSchema, { title: 'test' }, true],
    ['empty title', issueCreateSchema, { title: '' }, false],
    ['long title', issueCreateSchema, { title: 'a'.repeat(257) }, false],
    ['unknown issue field', issueCreateSchema, { title: 'test', extra: 1 }, false],
    ['duplicate labels', issueCreateSchema, { title: 'test', labels: ['bug', 'bug'] }, false],
    ['duplicate assignees', issueCreateSchema, { title: 'test', assignees: ['user', 'user'] }, false],
    ['empty update', issueUpdateSchema, {}, false],
    ['clear body', issueUpdateSchema, { body: '' }, true],
    ['null update body', issueUpdateSchema, { body: null }, false],
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
    ['valid metadata', metadataUpdateSchema, [{ path: 'DCSWorld/file.lua', updatedAt: '2026-01-01T00:00:00Z' }], true],
    ['invalid metadata date', metadataUpdateSchema, [{ path: 'DCSWorld/file.lua', updatedAt: 'not-a-date' }], false],
    ['empty metadata', metadataUpdateSchema, [], false],
    ['metadata count minimum', metadataResultSchema, { updatedCount: 0 }, false],
    ['metadata count maximum', metadataResultSchema, { updatedCount: 1001 }, false],
    ['invalid health date', healthSchema, { status: 'ok', timestamp: 'not-a-date' }, false],
    ['unknown health field', healthSchema, { status: 'ok', timestamp: '2026-01-01T00:00:00Z', extra: true }, false],
    [
      'invalid commit SHA',
      pullRequestCreationSchema,
      { number: 1, url: 'https://example.com', branchName: 'test', commitSha: 'wrong', reused: false },
      false,
    ],
    ['unknown query', listQuerySchema, { extra: '1' }, false],
    ['repeated limit', listQuerySchema, { limit: ['1', '2'] }, false],
    ['zero number', numberParamSchema, { number: '0' }, false],
    ['single file query', filesQuerySchema, { path: 'DCSWorld/file.lua' }, true],
    ['multiple file query', filesQuerySchema, { path: ['DCSWorld/a.lua', 'DCSWorld/b.lua'] }, true],
    ['duplicate file query', filesQuerySchema, { path: ['DCSWorld/a.lua', 'DCSWorld/a.lua'] }, false],
  ] as const)('%s', (_name, schema, value, valid) => {
    expect(schema.safeParse(value).success).toBe(valid);
  });

  it('coerces only numeric path/query values, without filling optional defaults', () => {
    expect(numberParamSchema.parse({ number: '123' })).toEqual({ number: 123 });
    expect(listQuerySchema.parse({ limit: '20' })).toEqual({ limit: 20 });
    expect(listQuerySchema.parse({})).toEqual({});
    const body = { title: 'test' };
    expect(issueCreateSchema.parse(body)).toEqual(body);
    expect(issueCreateSchema.safeParse({ title: 123 }).success).toBe(false);
  });
});
