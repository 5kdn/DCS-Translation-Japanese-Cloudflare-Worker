/** 入力検証の失敗を旧APIの結果オブジェクトへ変換するためのコード。 */
export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR' as const;

/** GitHub操作の入力検証で使用する内部エラー。 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
