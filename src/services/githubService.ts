import type { Octokit } from 'octokit';
import { isFilePathAllowed } from '@/config/filePermissionFilters';
import { RepositoryPathNotFoundError } from '@/errors/repositoryPathNotFoundError';
import { UserFacingError } from '@/errors/userFacingError';
import { decodeBase64 } from '@/helpers/base64Helper';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import type { PullRequestPayload, PullRequestResult, RepoFile, RepoFileDelete, RepoFileUpsert, TreeItem } from '@/types/types';

const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR' as const;

export type GitHubContext = { octokit: Octokit; owner: string; repo: string; defaultBranch: string };

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

type PullRequestFailure = { error: string; detail?: string; code?: typeof VALIDATION_ERROR_CODE };

/**
 * GitHub リポジトリからツリー構造（ファイル一覧）を取得し、不要な項目を除外して返す。
 */
export const getFilteredTreeItems = async (ctx: GitHubContext): Promise<TreeItem[]> => {
  const { octokit, owner, repo, defaultBranch } = ctx;
  const branchInfo = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: defaultBranch,
  });
  const tree_sha = branchInfo.data.commit.sha;
  const tree = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha,
    recursive: 'true',
  });

  const files = tree.data.tree;
  type TreeBlob = (typeof files)[number] & { type: 'blob'; path: string };
  const filtered: TreeBlob[] = files.filter(
    (item): item is TreeBlob => item.type === 'blob' && typeof item.path === 'string' && isFilePathAllowed(item.path),
  );
  return filtered;
};

/**
 * 指定パスのファイル内容を取得する。
 */
export const fetchRepositoryFile = async (
  ctx: GitHubContext,
  path: string,
): Promise<{ path: string; size: number; sha: string; content: Uint8Array }> => {
  ensureUserPathSafe(path);
  if (!isFilePathAllowed(path)) {
    throw new UserFacingError('FORBIDDEN_PATH', 403, '指定したパスは取得を許可していません。');
  }
  const { octokit, owner, repo, defaultBranch } = ctx;
  try {
    const result = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: defaultBranch,
    });

    if (Array.isArray(result.data)) {
      throw new UserFacingError('DIRECTORY_NOT_ALLOWED', 422, 'ディレクトリは指定できません。ファイルのみ指定してください。');
    }
    if (result.data.type !== 'file' || typeof result.data.content !== 'string') {
      throw new UserFacingError('UNSUPPORTED_CONTENT', 422, '対象パスはファイルではありません。');
    }

    const base64 = result.data.content.replace(/\s+/g, '');
    const content = decodeBase64(base64);
    return {
      path: result.data.path ?? path,
      size: typeof result.data.size === 'number' ? result.data.size : content.length,
      sha: result.data.sha ?? '',
      content,
    };
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const status = (err as { status?: number }).status;
      if (status === 404) {
        throw new RepositoryPathNotFoundError(`path "${path}" に該当するファイルが存在しない。`);
      }
    }
    throw err;
  }
};

/**
 * GitHub 上でブランチを作成し、コミットを登録して Pull Request を作成する。
 */
export const createPullRequest = async (
  payload: PullRequestPayload,
  ctx: GitHubContext,
): Promise<PullRequestResult | PullRequestFailure> => {
  try {
    _assertPullRequestPayload(payload);

    const { octokit, owner, repo, defaultBranch } = ctx;
    const base = defaultBranch;
    const branchName = payload.branchName || `feature/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const commitMessage = payload.commitMessage || payload.prTitle;

    const { baseCommitSha, baseTreeSha } = await _getBaseRefs(octokit, owner, repo, base);
    await _ensureBranch(octokit, owner, repo, branchName, baseCommitSha);
    const treeSha = await _buildTree(octokit, owner, repo, baseTreeSha, payload.files);
    const commitSha = await _createCommit(octokit, owner, repo, commitMessage, treeSha, baseCommitSha);
    await _updateBranchHead(octokit, owner, repo, branchName, commitSha);

    const pr = await _createOrGetPR(octokit, owner, repo, branchName, base, payload.prTitle, payload.prBody);

    return {
      prNumber: pr.number,
      prUrl: pr.html_url,
      branchName,
      commitSha,
      ...(pr.note ? { note: pr.note } : {}),
    };
  } catch (err: unknown) {
    if (err instanceof UserFacingError) throw err;
    if (err instanceof ValidationError) return { error: 'validation error', detail: err.message, code: VALIDATION_ERROR_CODE };
    if (err instanceof Error) return { error: 'failed to create pull request', detail: err.message };
    return { error: 'failed to create pull request', detail: String(err) };
  }
};

/* internal */

const _assertPullRequestPayload = (payload: PullRequestPayload): void => {
  if (!payload?.prTitle || !payload?.files?.length) throw new ValidationError('title と files は必須');

  payload.files.forEach((file) => {
    if (!file?.path?.trim()) throw new ValidationError('files.path は必須');
    ensureUserPathSafe(file.path);
    if (!isFilePathAllowed(file.path)) {
      console.error('[file-permission] disallowed paths detected', {
        requestedPath: file.path,
        invalidPaths: [file.path],
      });
      throw new ValidationError(`files.path が許可範囲外である: ${file.path}`);
    }
    if (_isDeleteFile(file)) {
      if ('content' in file && file.content !== undefined) {
        throw new ValidationError('operation が delete の場合は content を指定できない');
      }
      return;
    }
    if (!_isUpsertFile(file)) throw new ValidationError('operation が不正である');
    if (typeof file.content !== 'string') throw new ValidationError('files.content は必須');
  });
};

const _getBaseRefs = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  base: string,
): Promise<{ baseCommitSha: string; baseTreeSha: string }> => {
  const baseRef = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${base}` });
  const baseCommitSha = baseRef.data.object.sha;
  const baseCommit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: baseCommitSha });
  return { baseCommitSha, baseTreeSha: baseCommit.data.tree.sha };
};

const _ensureBranch = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  fromSha: string,
): Promise<void> => {
  try {
    const params = {
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: fromSha,
    };
    await octokit.rest.git.createRef(params);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status?: number }).status === 422) {
      throw new Error(`branch already exists: ${branchName}`);
    }
    throw err;
  }
};

const _buildTree = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  baseTreeSha: string,
  files: RepoFile[],
): Promise<string> => {
  const tree = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: files.map((file) => {
      if (_isDeleteFile(file))
        return {
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null as string | null,
        };
      return { path: file.path, mode: '100644', type: 'blob', content: file.content };
    }),
  });
  return tree.data.sha;
};

const _createCommit = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
): Promise<string> => {
  const commit = await octokit.rest.git.createCommit({ owner, repo, message, tree: treeSha, parents: [parentSha] });
  return commit.data.sha;
};

const _updateBranchHead = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  branchName: string,
  commitSha: string,
): Promise<void> => {
  const params = {
    owner,
    repo,
    ref: `heads/${branchName}`,
    sha: commitSha,
    force: false,
  };
  await octokit.rest.git.updateRef(params);
};

const _createOrGetPR = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  headBranch: string,
  base: string,
  title: string,
  body?: string,
): Promise<{ number: number; html_url: string; note?: 'existing pull request' }> => {
  try {
    const params = {
      owner,
      repo,
      head: headBranch,
      base,
      title,
      body,
    };
    const pr = await octokit.rest.pulls.create(params);
    return {
      number: pr.data.number,
      html_url: pr.data.html_url,
    };
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status?: number }).status === 422) {
      const prs = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open',
        head: `${owner}:${headBranch}`,
        base,
      });
      const existing = prs.data[0];
      if (existing) {
        return {
          number: existing.number,
          html_url: existing.html_url,
          note: 'existing pull request',
        };
      }
    }
    throw err;
  }
};

const _isDeleteFile = (file: RepoFile): file is RepoFileDelete => file.operation === 'delete';

const _isUpsertFile = (file: RepoFile): file is RepoFileUpsert => file.operation === undefined || file.operation === 'upsert';
