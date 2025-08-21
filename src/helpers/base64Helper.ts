/**
 * Uint8ArrayをBase64文字列にエンコードする
 */
export const encodeBase64 = (data: Uint8Array): string => {
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    for (const v of data) binary += String.fromCharCode(v);
    return globalThis.btoa(binary);
  }
  const Buf = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (typeof Buf === 'function') return Buf.from(data).toString('base64');
  throw new Error('Base64 encoder is not available.');
};

/**
 * Base64文字列をUint8Arrayにデコードする
 */
export const decodeBase64 = (value: string): Uint8Array => {
  const normalized = value.replace(/\s+/g, '');
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const Buf = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (typeof Buf === 'function') return Uint8Array.from(Buf.from(normalized, 'base64'));
  throw new Error('Base64 decoder is not available.');
};
