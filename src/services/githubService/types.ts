import type { VALIDATION_ERROR_CODE } from './errors';

/**
 * @summary GitHub 操作失敗時に返すエラー情報を表す。
 * @property error ユーザー向けに表示する簡易エラーメッセージ。
 * @property detail 追加の詳細メッセージ。
 * @property code 検証エラー時に VALIDATION_ERROR_CODE を付与する。
 */
export type GitHubOperationFailure = { error: string; detail?: string; code?: typeof VALIDATION_ERROR_CODE };

/**
 * GitHub 上の Issue 一覧取得結果の 1 件分を表す。
 */
export type GetIssuesItem = {
  /** Issue 番号 */
  issueNumber: number;
  /** Issue タイトル */
  title: string;
  /** Issue 本文 */
  body: string | null;
  /** Issue の URL */
  issueUrl: string;
  /** Issue の状態 */
  state: 'open' | 'closed';
  /** 最終更新日時（ISO 文字列） */
  updatedAt: string;
  /** 作成日時（ISO 文字列） */
  createdAt: string;
  /** クローズ日時（ISO 文字列。未クローズの場合は null） */
  closedAt: string | null;
  /** ラベル一覧 */
  labels: string[];
  /** アサインされたユーザー一覧 */
  assignees: string[];
};

/**
 * Issue 一覧取得時の入力を表す。
 */
export type GetIssuesRequest = {
  /** 取得対象の状態を表す。 */
  state?: 'open' | 'closed' | 'all';
};

/**
 * Issue 一覧取得の結果を表す。
 */
export type GetIssuesResult = GetIssuesItem[];
