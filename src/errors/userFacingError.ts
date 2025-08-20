/**
 * ユーザーに返却する抽象エラーを表す。
 */
export class UserFacingError extends Error {
  static readonly defaultMessage = '処理に失敗しました。時間をおいて再度お試しください。';

  constructor(
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly status: number = 500,
    public readonly userMessage: string = UserFacingError.defaultMessage,
    options?: { cause?: unknown },
  ) {
    super(userMessage);
    this.name = 'UserFacingError';
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 任意のエラーをユーザー向けエラーに変換する。
 */
export const toUserFacingError = (error: unknown): UserFacingError => {
  if (error instanceof UserFacingError) {
    return error;
  }
  return new UserFacingError('INTERNAL_ERROR', 500, UserFacingError.defaultMessage, { cause: error });
};
