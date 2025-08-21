/**
 * 単純なトークンバケット方式のレートリミッタを提供する。
 */
export class TokenBucketRateLimiter {
  private readonly buckets = new Map<string, { remaining: number; resetAt: number }>();

  constructor(
    public readonly limit: number,
    public readonly windowMs: number,
  ) {}

  /**
   * 指定キーのトークンを消費して結果を返却する。
   */
  consume(
    key: string,
    now: number = Date.now(),
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
  } {
    const current = this.buckets.get(key);
    if (!current || now >= current.resetAt) {
      const resetAt = now + this.windowMs;
      const next = { remaining: this.limit, resetAt };
      this.buckets.set(key, next);
      return this.consume(key, now);
    }

    if (current.remaining <= 0) {
      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        resetAt: current.resetAt,
      };
    }

    current.remaining -= 1;
    return {
      allowed: true,
      limit: this.limit,
      remaining: current.remaining,
      resetAt: current.resetAt,
    };
  }
}
