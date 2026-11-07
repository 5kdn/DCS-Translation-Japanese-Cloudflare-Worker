import { describe, expect, it, vi } from 'vitest';
import { expectV2Contract } from '../../../../../helpers/v2Contract';
import { mocks, prInput, request, sha } from '../../../../../helpers/v2Write';

vi.mock('octokit', async () => (await import('../../../../../helpers/v2WriteMocks')).octokitMock);

describe('POST /v2/prs', () => {
  it('creates a commit from upserts and deletes without force-pushing', async () => {
    const response = await request('POST', '/prs', prInput);
    expect(response.status).toBe(200);
    expect(await expectV2Contract(response, 'createPullRequest')).toMatchObject({
      number: 2,
      branchName: prInput.branchName,
      commitSha: sha,
      reused: false,
    });
    expect(mocks.createTree).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      base_tree: sha,
      tree: [
        { path: 'DCSWorld/new.lua', mode: '100644', type: 'blob', content: 'translated' },
        { path: 'DCSWorld/old.lua', mode: '100644', type: 'blob', sha: null },
      ],
    });
    expect(mocks.updateRef).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      ref: 'heads/translation/test',
      sha,
      force: false,
    });
    expect(mocks.createPr).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      head: 'translation/test',
      base: 'main',
      title: 'Translation',
    });
  });

  it.each(['main', '../bad', 'with space', 'branch.lock', 'bad@{ref', 'bad\\\\ref', 'bad//ref'])(
    'rejects unsafe branch %s',
    async (branchName) => {
      const response = await request('POST', '/prs', { ...prInput, branchName });
      expect(response.status).toBe(422);
      await expectV2Contract(response, 'createPullRequest');
      expect(mocks.createRef).not.toHaveBeenCalled();
    },
  );

  it.each(['/etc/passwd', 'DCSWorld/../bad', 'DCSWorld/.git/config', 'README.md', 'DCSWorld/a\\\\b.lua'])(
    'rejects unsafe PR path %s',
    async (path) => {
      const response = await request('POST', '/prs', { ...prInput, files: [{ path, content: 'x' }] });
      expect(response.status).toBe(400);
      await expectV2Contract(response, 'createPullRequest');
      expect(mocks.createRef).not.toHaveBeenCalled();
    },
  );

  it('rejects duplicate file paths before creating a branch', async () => {
    const response = await request('POST', '/prs', { ...prInput, files: [prInput.files[0], prInput.files[0]] });
    expect(response.status).toBe(422);
    expect(mocks.createRef).not.toHaveBeenCalled();
  });

  it('returns conflict without modifying an existing branch', async () => {
    mocks.createRef.mockRejectedValue({ status: 422 });
    const response = await request('POST', '/prs', prInput);
    expect(response.status).toBe(409);
    await expectV2Contract(response, 'createPullRequest');
    expect(mocks.updateRef).not.toHaveBeenCalled();
    expect(mocks.createTree).not.toHaveBeenCalled();
  });

  it('reuses the open PR when GitHub reports that it already exists', async () => {
    mocks.createPr.mockRejectedValue({ status: 422 });
    mocks.listPrs.mockResolvedValue({ data: [{ number: 2, html_url: 'https://github.com/test-owner/test-repo/pull/2' }] });
    const response = await request('POST', '/prs', { ...prInput, prBody: 'Body', commitMessage: 'Commit' });
    expect(response.status).toBe(200);
    expect(await expectV2Contract(response, 'createPullRequest')).toMatchObject({ reused: true });
    expect(mocks.createCommit).toHaveBeenCalledWith(expect.objectContaining({ message: 'Commit' }));
    expect(mocks.createPr).toHaveBeenCalledWith(expect.objectContaining({ body: 'Body' }));
    expect(mocks.listPrs).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      state: 'open',
      head: 'test-owner:translation/test',
      base: 'main',
    });
  });

  it('returns 422 when PR creation is rejected without an existing PR', async () => {
    mocks.createPr.mockRejectedValue({ status: 422 });
    mocks.listPrs.mockResolvedValue({ data: [] });
    const response = await request('POST', '/prs', prInput);
    expect(response.status).toBe(422);
    await expectV2Contract(response, 'createPullRequest');
  });
});
