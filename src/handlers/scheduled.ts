import { JwtVerificationService } from '@/services/jwtVerificationService';
import type { Bindings } from '@/types/env';

/**
 * @summary 使用済みjtiのクリーンアップを定期実行するハンドラである。
 * @param _event スケジュールイベントを受け取る。
 * @param env バインディングを受け取る。
 * @param ctx 実行コンテキストを受け取る。
 */
export const scheduled = async (_event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
  const db: D1Database | undefined = env.JWT_REPLAY_DB;
  if (!db) {
    console.warn('JWT_REPLAY_DB is not configured; skip used_jti cleanup');
    return;
  }

  const grace = 1 * 24 * 60 * 60;
  const service = new JwtVerificationService(db);
  ctx.waitUntil(service.cleanupExpiredJti(grace));
};
