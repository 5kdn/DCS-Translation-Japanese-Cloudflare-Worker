/**
 * リポジトリ内の対象パスが存在しない場合に投げる。
 */
export class RepositoryPathNotFoundError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'PATH_NOT_FOUND',
  ) {
    super(message);
    this.name = 'RepositoryPathNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
