import { describe, expect, it } from 'vitest';
import { TokenBucketRateLimiter } from '@/services/rateLimiterService';

const NOW = 1_700_000_000_000;

describe('TokenBucketRateLimiter', () => {
  it('毎回 resetAt を維持したままトークンを減らす', () => {
    const limiter = new TokenBucketRateLimiter(2, 5_000);

    const first = limiter.consume('key', NOW);
    expect(first).toEqual({
      allowed: true,
      limit: 2,
      remaining: 1,
      resetAt: NOW + 5_000,
    });

    const second = limiter.consume('key', NOW + 1_000);
    expect(second).toEqual({
      allowed: true,
      limit: 2,
      remaining: 0,
      resetAt: NOW + 5_000,
    });

    const third = limiter.consume('key', NOW + 2_000);
    expect(third).toEqual({
      allowed: false,
      limit: 2,
      remaining: 0,
      resetAt: NOW + 5_000,
    });
  });

  it('ウィンドウ経過後にカウントをリセットしキーごとに独立する', () => {
    const limiter = new TokenBucketRateLimiter(1, 10_000);

    const first = limiter.consume('A', NOW);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);

    const rejected = limiter.consume('A', NOW + 1_000);
    expect(rejected.allowed).toBe(false);
    expect(rejected.remaining).toBe(0);

    const reset = limiter.consume('A', NOW + 11_000);
    expect(reset).toEqual({
      allowed: true,
      limit: 1,
      remaining: 0,
      resetAt: NOW + 21_000,
    });

    const otherKey = limiter.consume('B', NOW + 11_000);
    expect(otherKey).toEqual({
      allowed: true,
      limit: 1,
      remaining: 0,
      resetAt: NOW + 21_000,
    });
  });
});
