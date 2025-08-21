import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Problem Details 形式のレスポンス構造を表現する。
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: ContentfulStatusCode;
  detail: string;
  instance: string;
  errors?: Record<string, readonly string[]>;
}

/**
 * Problem Details 応答を生成する。
 */
export const createProblemDetails = (details: ProblemDetails): ProblemDetails => details;

/**
 * Hono コンテキストへ Problem Details を送出する。
 */
export const respondProblemDetails = (c: Context, problem: ProblemDetails): Response =>
  c.json(problem, problem.status, {
    'Content-Type': 'application/problem+json',
  });
