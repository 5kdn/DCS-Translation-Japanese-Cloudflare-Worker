import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ClaimValidationError, JwtReplayError } from '@/errors/claimValidationError';

/**
 * @summary JWS(JWT)の検証を行うサービスである。
 */
export class JwtVerificationService {
  static readonly ISSUER = 'https://token.actions.githubusercontent.com';
  static readonly JWKS = createRemoteJWKSet(new URL(`${JwtVerificationService.ISSUER}/.well-known/jwks`));

  /**
   * @summary D1Databaseを受け取り、サービスの依存関係として保持する。
   * @param db D1Databaseを渡す。
   */
  public constructor(private readonly db: D1Database) {}

  /**
   * @summary GitHub Actions の OIDC ID トークン検証・リプレイ検知を行う。
   * @param token 検証対象のトークンを指定する。
   * @param audience 検証対象の audience を指定する。
   * @param expectedClaims 期待するクレームを指定する。
   * @returns 検証済みのペイロードとヘッダーを返す。
   * @throws {ClaimValidationError} クレーム検証や必須クレーム不足時に送出する。
   * @throws {JwtReplayError} jtiの再利用を検知した場合に送出する。
   */
  public async verifyGithubActionsIdToken(token: string, audience: string, expectedClaims: Record<string, string>) {
    const { payload, protectedHeader } = await jwtVerify(token, JwtVerificationService.JWKS, {
      issuer: JwtVerificationService.ISSUER,
      audience,
    });

    for (const [key, expected] of Object.entries(expectedClaims)) {
      if (payload[key] !== expected) {
        throw new ClaimValidationError(key, expected, payload[key]);
      }
    }

    const jti = typeof payload.jti === 'string' ? payload.jti : undefined;
    const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!jti) {
      throw new ClaimValidationError('jti', 'string', payload.jti);
    }
    if (!exp) {
      throw new ClaimValidationError('exp', 'number', payload.exp);
    }

    try {
      await this.registerJti(jti, exp, sub);
    } catch (err) {
      if (err instanceof JwtReplayError) {
        console.warn(err.message, { jti, exp, sub });
      }
      throw err;
    }

    return { payload, header: protectedHeader };
  }

  /**
   * @summary 期限切れの使用済みjtiを削除する。
   * @param graceSeconds 猶予秒数を指定する(最小は1時間)。
   * @returns 削除件数を返す。
   */
  public async cleanupExpiredJti(graceSeconds = 1 * 60 * 60): Promise<number> {
    const safeGraceSeconds = Math.max(1 * 60 * 60, Math.floor(graceSeconds));
    const nowSeconds = Math.floor(Date.now() / 1000);
    const threshold = nowSeconds - safeGraceSeconds;
    const result = await this.db.prepare('DELETE FROM used_jti WHERE exp <= ?1').bind(threshold).run();
    const deleted = result.meta?.changes ?? 0;
    console.info('used_jti cleanup completed', { deleted, threshold, graceSeconds: safeGraceSeconds });
    return deleted;
  }

  /**
   * @summary D1にjtiを登録する。
   * @param jti JWTのjtiを渡す。
   * @param exp JWTのexpを渡す。
   * @param sub JWTのsubを渡す。
   * @throws {JwtReplayError} 既にjtiが登録されている場合に送出する。
   */
  private async registerJti(jti: string, exp: number, sub?: string | null): Promise<void> {
    const usedAt = Date.now();
    const result = await this.db
      .prepare('INSERT INTO used_jti (jti, exp, used_at, sub) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(jti) DO NOTHING')
      .bind(jti, exp, usedAt, sub ?? null)
      .run();

    if ((result.meta?.changes ?? 0) === 0) {
      throw new JwtReplayError(jti);
    }
  }
}
