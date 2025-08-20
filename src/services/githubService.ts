import type { Octokit } from 'octokit';
import { isFilePathAllowed } from '@/config/filePermissionFilters';
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
