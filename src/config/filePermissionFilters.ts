/**
 * GitHub ツリー取得時に適用するファイル許可フィルタの正規表現を定義する。
 */
export const FILE_PERMISSION_ALLOW_FILTERS: ReadonlyArray<RegExp> = [
  // DCSWorld/ から始まる
  /^DCSWorld\//,
  // UserMissions/ から始まる
  /^UserMissions\//,
];

/**
 * GitHub ツリー取得時に適用するファイル拒否フィルタの正規表現を定義する。
 */
export const FILE_PERMISSION_DENY_FILTERS: ReadonlyArray<RegExp> = [
  // トップレベルの.git ディレクトリ
  /^\.git/,
  // .git から始まるファイル
  /\/\.git/,
];

/**
 * ファイルパスが許可フィルタに適合するか判定する。
 */
export const isFilePathAllowed = (path: string): boolean =>
  FILE_PERMISSION_ALLOW_FILTERS.some((pattern) => pattern.test(path)) &&
  FILE_PERMISSION_DENY_FILTERS.every((pattern) => !pattern.test(path));
