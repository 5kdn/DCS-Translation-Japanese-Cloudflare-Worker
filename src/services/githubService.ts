import type { Octokit } from 'octokit';
import { isFilePathAllowed } from '@/config/filePermissionFilters';
import { RepositoryPathNotFoundError } from '@/errors/repositoryPathNotFoundError';
import { UserFacingError } from '@/errors/userFacingError';
import { decodeBase64 } from '@/helpers/base64Helper';
import { ensureUserPathSafe } from '@/helpers/pathSafetyHelper';
import type { TreeItem } from '@/types/types';

export type GitHubContext = { octokit: Octokit; owner: string; repo: string; defaultBranch: string };

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
