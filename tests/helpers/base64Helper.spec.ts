// base64.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from '@/helpers/base64Helper';

// 原状保持用
const orig = {
  btoa: globalThis.btoa,
  atob: globalThis.atob,
  Buffer: globalThis.Buffer,
};

beforeEach(() => {
  // それぞれのテストで明示的に設定し直す
  globalThis.btoa = orig.btoa;
  globalThis.atob = orig.atob;
  globalThis.Buffer = orig.Buffer;
});

describe('encodeBase64', () => {
  it('Node/Buffer 経路: Uint8Array -> Base64', () => {
    // Arrange
    // @ts-expect-error Node環境前提でbtoaを無効化
    globalThis.btoa = undefined;

    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

    // Act
    const actual = encodeBase64(bytes);

    // Assert
    expect(actual).toBe('SGVsbG8=');
  });

  it('Web/btoa 経路: Uint8Array -> Base64（非ASCIIバイトも含む）', () => {
    // Arrange
    // btoaをモック（入力はbinary/latin1想定）
    globalThis.btoa = (s: string) =>
      // NodeのBufferで同等変換
      Buffer.from(s, 'binary').toString('base64');
    // Buffer経路に入らないようにしても良いが、条件分岐はbtoa優先なので不要

    const bytes = new Uint8Array([0x00, 0xff, 0x41, 0x42, 0x43]); // [NUL, 255, 'A','B','C']

    // Act
    const actual = encodeBase64(bytes);

    // Assert
    expect(actual).toBe('AP9BQkM=');
  });

  it('両方不可なら例外を投げる', () => {
    // Arrange
    // @ts-expect-error
    globalThis.btoa = undefined;
    // @ts-expect-error
    globalThis.Buffer = undefined;

    const bytes = new Uint8Array([1, 2, 3]);

    // Act + Assert
    expect(() => encodeBase64(bytes)).toThrow('Base64 encoder is not available.');
  });
});

describe('decodeBase64', () => {
  it('Node/Buffer 経路: Base64 -> Uint8Array', () => {
    // Arrange
    // @ts-expect-error Node環境前提でatobを無効化
    globalThis.atob = undefined;

    const b64 = 'SGVsbG8='; // "Hello"

    // Act
    const actual = decodeBase64(b64);

    // Assert
    expect([...actual]).toEqual([72, 101, 108, 108, 111]);
  });

  it('Web/atob 経路: Base64 -> Uint8Array', () => {
    // Arrange
    // atobをモック（出力はbinary/latin1文字列）
    globalThis.atob = (s: string) => Buffer.from(s, 'base64').toString('binary');

    const b64 = 'TWE='; // "Ma"

    // Act
    const actual = decodeBase64(b64);

    // Assert
    expect([...actual]).toEqual([77, 97]);
  });

  it('デコード時に空白や改行を無視する', () => {
    // Arrange
    // @ts-expect-error
    globalThis.atob = undefined; // Buffer経路を使う
    const withSpaces = 'S G V s b G 8='; // "SGVsbG8=" に空白混入

    // Act
    const actual = decodeBase64(withSpaces);

    // Assert
    expect([...actual]).toEqual([72, 101, 108, 108, 111]);
  });

  it('両方不可なら例外を投げる', () => {
    // Arrange
    // @ts-expect-error
    globalThis.atob = undefined;
    // @ts-expect-error
    globalThis.Buffer = undefined;
    const b64 = 'AA==';

    // Act + Assert
    expect(() => decodeBase64(b64)).toThrow('Base64 decoder is not available.');
  });
});
