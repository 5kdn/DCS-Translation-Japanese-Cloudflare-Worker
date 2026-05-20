import { jwtVerify } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClaimValidationError, JwtReplayError } from '@/errors/claimValidationError';
import { JwtVerificationService } from '@/services/jwtVerificationService';

vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'jwks'),
  jwtVerify: vi.fn(),
}));

const jwtVerifyMock = vi.mocked(jwtVerify);

type Statement = {
  bind: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
};

const makeStatement = (options?: { runImpl?: () => Promise<unknown> }) => {
  const statement: Statement = {
    bind: vi.fn(),
    run: vi.fn(),
  };
  statement.bind.mockImplementation(() => statement);
  statement.run.mockImplementation(options?.runImpl ?? (async () => ({ meta: { changes: 1 } })));
  return statement;
};

const makeDb = (options?: { insertRunImpl?: () => Promise<unknown>; deleteRunImpl?: () => Promise<unknown> }) => {
  const insertStatement = makeStatement({ runImpl: options?.insertRunImpl });
  const deleteStatement = makeStatement({ runImpl: options?.deleteRunImpl });
  const prepare = vi.fn((query: string) => {
    if (query.startsWith('DELETE')) {
      return deleteStatement;
    }
    return insertStatement;
  });
  const db = { prepare } as unknown as D1Database;
  return { db, prepare, insertStatement, deleteStatement };
};

const basePayload = {
  jti: 'jti-1',
  exp: 1_700_000_000,
  sub: 'repo:owner/repo:ref',
  repository: 'owner/repo',
};

describe('JwtVerificationService.verifyGithubActionsIdToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('検証済みトークンを返しjtiを登録する', async () => {
    const { db, prepare, insertStatement } = makeDb();
    const service = new JwtVerificationService(db);
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    jwtVerifyMock.mockResolvedValue({
      payload: basePayload,
      protectedHeader: { alg: 'RS256' },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    const result = await service.verifyGithubActionsIdToken('token', 'aud', { repository: 'owner/repo' });

    expect(jwtVerifyMock).toHaveBeenCalledWith('token', 'jwks', {
      issuer: JwtVerificationService.ISSUER,
      audience: 'aud',
    });
    expect(prepare).toHaveBeenCalledWith(
      'INSERT INTO used_jti (jti, exp, used_at, sub) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(jti) DO NOTHING',
    );
    expect(insertStatement.bind).toHaveBeenCalledWith('jti-1', 1_700_000_000, now, 'repo:owner/repo:ref');
    expect(result).toEqual({
      payload: basePayload,
      header: { alg: 'RS256' },
    });
  });

  it('期待クレームが一致しない場合はClaimValidationErrorを投げる', async () => {
    const { db, prepare } = makeDb();
    const service = new JwtVerificationService(db);
    jwtVerifyMock.mockResolvedValue({
      payload: { ...basePayload, repository: 'other/repo' },
      protectedHeader: { alg: 'RS256' },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(service.verifyGithubActionsIdToken('token', 'aud', { repository: 'owner/repo' })).rejects.toBeInstanceOf(
      ClaimValidationError,
    );
    expect(prepare).not.toHaveBeenCalled();
  });

  it('jtiが無い場合はClaimValidationErrorを投げる', async () => {
    const { db } = makeDb();
    const service = new JwtVerificationService(db);
    jwtVerifyMock.mockResolvedValue({
      payload: { ...basePayload, jti: undefined },
      protectedHeader: { alg: 'RS256' },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(service.verifyGithubActionsIdToken('token', 'aud', { repository: 'owner/repo' })).rejects.toBeInstanceOf(
      ClaimValidationError,
    );
  });

  it('jtiが再利用された場合はJwtReplayErrorを投げる', async () => {
    const { db, insertStatement } = makeDb({
      insertRunImpl: async () => ({ meta: { changes: 0 } }),
    });
    const service = new JwtVerificationService(db);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    jwtVerifyMock.mockResolvedValue({
      payload: basePayload,
      protectedHeader: { alg: 'RS256' },
    } as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(service.verifyGithubActionsIdToken('token', 'aud', { repository: 'owner/repo' })).rejects.toBeInstanceOf(
      JwtReplayError,
    );
    expect(insertStatement.run).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe('JwtVerificationService.cleanupExpiredJti', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('猶予秒数の最小値を適用して期限切れを削除する', async () => {
    const { db, deleteStatement } = makeDb({
      deleteRunImpl: async () => ({ meta: { changes: 3 } }),
    });
    const service = new JwtVerificationService(db);
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const deleted = await service.cleanupExpiredJti(10);

    const nowSeconds = Math.floor(now / 1000);
    const threshold = nowSeconds - 1 * 60 * 60;
    expect(deleteStatement.bind).toHaveBeenCalledWith(threshold);
    expect(deleteStatement.run).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith('used_jti cleanup completed', {
      deleted: 3,
      threshold,
      graceSeconds: 1 * 60 * 60,
    });
    expect(deleted).toBe(3);
  });
});
