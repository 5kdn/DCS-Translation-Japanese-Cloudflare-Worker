import type { UserFacingError } from '@/errors/userFacingError';

export const INTERNAL_ERROR_MESSAGE = 'Internal Error';

/**
 * エラーレスポンス用のメッセージを整形する。
 */
export const formatErrorMessage = (error: UserFacingError): string => {
  const status = error.status ?? 500;
  if (status >= 500 && status < 600) {
    return INTERNAL_ERROR_MESSAGE;
  }
  if (status >= 400 && status < 500) {
    return error.userMessage;
  }
  return error.userMessage ?? INTERNAL_ERROR_MESSAGE;
};
