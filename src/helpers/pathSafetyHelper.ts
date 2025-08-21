import { UserFacingError } from '@/errors/userFacingError';

// biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字の検出は意図的
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
const WINDOWS_ABSOLUTE_PATH_PATTERN = /^[A-Za-z]:[\\/]/;

/**
 * ユーザー入力パスの安全性を検証し、不正の場合はUserFacingErrorを送出する。
 */
export const ensureUserPathSafe = (value: string): void => {
  if (!value) return;

  const trimmed = value.trim();
  if (trimmed.length === 0) return;

  if (_hasControlChars(trimmed) || _isAbsolutePath(trimmed) || _hasPathTraversal(trimmed)) {
    throw new UserFacingError('INVALID_PATH', 400, '不正なパスが指定されました。安全なパスを指定してください。');
  }
};

const _hasControlChars = (input: string): boolean => CONTROL_CHAR_PATTERN.test(input);

const _isAbsolutePath = (input: string): boolean => {
  if (input.startsWith('/') || input.startsWith('\\')) {
    return true;
  }
  return WINDOWS_ABSOLUTE_PATH_PATTERN.test(input);
};

const _hasPathTraversal = (input: string): boolean => /(^|[\\/])\.\.(?=[\\/]|$)/.test(input);
