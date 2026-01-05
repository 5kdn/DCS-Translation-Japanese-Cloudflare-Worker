/**
 * クレーム検証失敗時に送出する例外。
 */
export class ClaimValidationError extends Error {
  /**
   * @param {string} claim 検証対象のクレーム名を指定する。
   * @param {unknown} expected 期待する値を指定する。
   * @param {unknown} actual 実際の値を指定する。
   */
  constructor(claim: string, expected: unknown, actual: unknown) {
    super(`Invalid claim: ${claim} expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    this.name = 'ClaimValidationError';
  }
}

/**
 * JWTリプレイ検知時に送出する例外。
 */
export class JwtReplayError extends Error {
  /**
   * @param {string} jti 再利用されたjtiを指定する。
   */
  constructor(jti: string) {
    super(`JWTのjtiが再利用されています: ${jti}`);
    this.name = 'JwtReplayError';
  }
}
