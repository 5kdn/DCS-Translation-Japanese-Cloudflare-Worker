import { describe, expect, it } from 'vitest';
import { UserFacingError } from '@/errors/userFacingError';
import { formatErrorMessage, INTERNAL_ERROR_MESSAGE } from '@/helpers/httpErrorMessageHelper';

describe('formatErrorMessage', () => {
  it('400番台エラーでは詳細メッセージを返す', () => {
    const error = new UserFacingError('INVALID_REQUEST', 400, '詳細エラー');
    const message = formatErrorMessage(error);
    expect(message).toBe('詳細エラー');
  });

  it('500番台エラーではInternal Errorを返す', () => {
    const error = new UserFacingError('INTERNAL_ERROR', 503, '詳細は隠すべき');
    const message = formatErrorMessage(error);
    expect(message).toBe(INTERNAL_ERROR_MESSAGE);
  });

  it('ステータス未指定時はInternal Errorを返す', () => {
    const error = new UserFacingError('UNKNOWN', undefined as unknown as number, 'fallback');
    const message = formatErrorMessage(error);
    expect(message).toBe(INTERNAL_ERROR_MESSAGE);
  });
});
