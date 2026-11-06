import { expect } from 'vitest';
import { operations } from '@/api/v2/generated/operations';
import { responses } from '@/api/v2/generated/validators.js';

/** 契約を照合するOASの操作識別子。 */
type OperationId = keyof typeof operations;

/**
 * 実応答のstatus・Content-Type・本文をOAS由来の検証コードへ照合する。
 * 本文を読み取るため、応答はこの呼び出し以降に再読込できない。
 *
 * @param response 契約検証する実応答。HEADの本文検証には使用しない。
 * @param operationId OASのoperationId。省略時は共通Problemスキーマへ照合する。
 * @returns 検証済みのJSON本文、またはHTML文字列。
 * @throws 契約違反・JSON解析失敗時にテストを失敗させるエラー。
 */
export const expectV2Contract = async (response: Response, operationId?: OperationId): Promise<unknown> => {
  const mediaType = response.headers.get('Content-Type')?.split(';')[0];
  expect(mediaType).toBeDefined();
  const body: unknown = mediaType === 'text/html' ? await response.text() : await response.json();
  let validator = responses.problem;
  if (operationId) {
    const definitions: Record<string, Record<string, string>> = operations[operationId].responses;
    const definition = definitions[String(response.status)] ?? (response.status >= 400 ? definitions.default : undefined);
    expect(definition, `Undocumented status ${response.status}`).toBeDefined();
    const key = definition?.[mediaType ?? ''];
    expect(key, `Undocumented Content-Type ${mediaType}`).toBeDefined();
    validator = key ? responses[key] : undefined;
  } else {
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  expect(validator).toBeDefined();
  expect(validator?.(body), JSON.stringify(validator?.errors)).toBe(true);
  if (response.status >= 400) {
    expect(mediaType).toBe('application/problem+json');
    expect(body).toHaveProperty('status', response.status);
  }
  return body;
};
