export interface TreeItem {
  path: string;
  mode: string;
  type: 'blob';
  sha: string;
  size?: number | undefined;
  url?: string | undefined;
  updatedAt: string | null;
}

/** API リクエストボディ */
export interface PullRequestPayload {
  /** PR タイトル（必須） */
  prTitle: string;
  /** PR 本文（任意） */
  prBody?: string;
  /** 新規ブランチ名（省略時は feature/<timestamp>） */
  branchName: string;
  /** コミットメッセージ（省略時 title と同一） */
  commitMessage?: string;
  /** コミット対象ファイル群（必須） */
  files: RepoFile[];
}

/** コミット対象ファイル */
export type RepoFile = RepoFileUpsert | RepoFileDelete;

/** リポジトリに追加・更新するファイル */
export interface RepoFileUpsert {
  /** ファイルパス（例: "src/index.ts"） */
  path: string;
  /** ファイル内容（UTF-8 テキスト） */
  content: string;
  /** 操作種別（省略時は upsert） */
  operation?: Exclude<RepoFileOperation, 'delete'>;
}

/** リポジトリから削除するファイル */
export interface RepoFileDelete {
  /** ファイルパス（例: "src/index.ts"） */
  path: string;
  /** 操作種別 */
  operation: Extract<RepoFileOperation, 'delete'>;
}

/** コミット対象ファイルの操作種別 */
export type RepoFileOperation = 'upsert' | 'delete';

/** API レスポンス */
export interface PullRequestResult {
  /** PR 番号 */
  prNumber: number;
  /** PR の URL */
  prUrl: string;
  /** 作成されたブランチ名 */
  branchName: string;
  /** 最新コミットの SHA */
  commitSha: string;
  /** 既存 PR 再利用時の注記（存在する場合のみ） */
  note?: string;
}

/** Issue 作成に必要な入力を表す。 */
export interface IssuePayload {
  /** Issue のタイトル（必須） */
  title: string;
  /** Issue の本文（任意） */
  body?: string;
  /** 適用するラベル（任意） */
  labels?: string[];
  /** アサインするユーザー（任意） */
  assignees?: string[];
}

/** Issue 作成結果を表す。 */
export interface IssueResult {
  /** Issue 番号 */
  issueNumber: number;
  /** Issue の URL */
  issueUrl: string;
}
