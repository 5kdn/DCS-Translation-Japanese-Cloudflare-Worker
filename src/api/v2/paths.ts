import { isFilePathAllowed } from '@/config/filePermissionFilters';

/**
 * 許可ディレクトリ・UTF-8長・危険なセグメントを、パスを補正せず検証する。
 *
 * @param path 検証するリポジトリ相対のファイルパス。
 * @returns UTF-8で4096バイト以下の許可パスで、バックスラッシュ・制御文字・
 * 空セグメント・`.`・`..`・`.git`で始まるセグメントを含まない場合はtrue。
 */
export const validRepositoryPath = (path: string): boolean =>
  new TextEncoder().encode(path).length <= 4096 &&
  isFilePathAllowed(path) &&
  !/[\\\p{Cc}]/u.test(path) &&
  path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..' && !segment.startsWith('.git'));
