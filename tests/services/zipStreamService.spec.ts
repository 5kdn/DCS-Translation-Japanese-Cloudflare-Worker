import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ZipStreamEntry } from '@/services/zipStreamService';

(globalThis as { ReadableStream: typeof NodeReadableStream }).ReadableStream = NodeReadableStream;

let buildZip64Stream!: typeof import('@/services/zipStreamService')['buildZip64Stream'];

beforeAll(async () => {
  ({ buildZip64Stream } = await import('@/services/zipStreamService'));
});

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_FILE_HEADER_SIGNATURE = 0x02014b50;
const ZIP64_END_OF_CENTRAL_DIR_SIGNATURE = 0x06064b50;
const ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE = 0x07064b50;
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
const ZIP_VERSION = 45;
const ZIP64_EXTRA_HEADER_ID = 0x0001;

const makeEntries = (): ReadonlyArray<ZipStreamEntry> => [
  {
    name: 'DCSWorld/Mods/a.txt',
    content: textEncoder.encode('ABC'),
    lastModified: new Date('2024-04-05T06:07:08Z'),
  },
  {
    name: 'UserMissions/mission.lua',
    content: Uint8Array.from([0, 255, 16, 32]),
    lastModified: new Date('2024-04-06T01:02:04Z'),
  },
];

const expectedCrcs = [2743272264, 4000373096];
const expectedDos = [
  { dosDate: 22661, dosTime: 12516 },
  { dosDate: 22662, dosTime: 2114 },
];

const collectStream = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  // Read sequentially to preserve order.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
};

describe('buildZip64Stream', () => {
  it('エントリーメタデータを生成する', () => {
    const entries = makeEntries();

    const result = buildZip64Stream(entries);

    expect(result.entries).toEqual([
      {
        name: 'DCSWorld/Mods/a.txt',
        size: 3n,
        compressedSize: 3n,
        crc32: expectedCrcs[0],
      },
      {
        name: 'UserMissions/mission.lua',
        size: 4n,
        compressedSize: 4n,
        crc32: expectedCrcs[1],
      },
    ]);
  });

  it('ZIP64 のローカルヘッダーから終端までを正しい順序で出力する', async () => {
    const sources = makeEntries();

    const { stream, entries } = buildZip64Stream(sources);
    const bytes = await collectStream(stream);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const localOffsets: bigint[] = [];

    let cursor = 0;
    sources.forEach((source, index) => {
      localOffsets.push(BigInt(cursor));
      expect(view.getUint32(cursor, true)).toBe(LOCAL_FILE_HEADER_SIGNATURE);
      expect(view.getUint16(cursor + 4, true)).toBe(ZIP_VERSION);
      expect(view.getUint16(cursor + 6, true)).toBe(0);
      expect(view.getUint16(cursor + 8, true)).toBe(0);
      expect(view.getUint16(cursor + 10, true)).toBe(expectedDos[index].dosTime);
      expect(view.getUint16(cursor + 12, true)).toBe(expectedDos[index].dosDate);
      expect(view.getUint32(cursor + 14, true)).toBe(entries[index].crc32);
      expect(view.getUint32(cursor + 18, true)).toBe(0xffffffff);
      expect(view.getUint32(cursor + 22, true)).toBe(0xffffffff);
      const fileNameLength = view.getUint16(cursor + 26, true);
      const extraLength = view.getUint16(cursor + 28, true);
      const nameBytes = bytes.subarray(cursor + 30, cursor + 30 + fileNameLength);
      expect(textDecoder.decode(nameBytes)).toBe(source.name);
      const localExtraView = new DataView(bytes.buffer, bytes.byteOffset + cursor + 30 + fileNameLength, extraLength);
      expect(localExtraView.getUint16(0, true)).toBe(ZIP64_EXTRA_HEADER_ID);
      expect(localExtraView.getUint16(2, true)).toBe(16);
      expect(localExtraView.getBigUint64(4, true)).toBe(BigInt(source.content.byteLength));
      expect(localExtraView.getBigUint64(12, true)).toBe(BigInt(source.content.byteLength));
      const dataStart = cursor + 30 + fileNameLength + extraLength;
      const dataEnd = dataStart + source.content.byteLength;
      expect(bytes.subarray(dataStart, dataEnd)).toEqual(source.content);
      cursor = dataEnd;
    });

    const centralDirectoryOffset = cursor;
    sources.forEach((source, index) => {
      expect(view.getUint32(cursor, true)).toBe(CENTRAL_FILE_HEADER_SIGNATURE);
      expect(view.getUint16(cursor + 4, true)).toBe(ZIP_VERSION);
      expect(view.getUint16(cursor + 6, true)).toBe(ZIP_VERSION);
      expect(view.getUint16(cursor + 8, true)).toBe(0);
      expect(view.getUint16(cursor + 10, true)).toBe(0);
      expect(view.getUint16(cursor + 12, true)).toBe(expectedDos[index].dosTime);
      expect(view.getUint16(cursor + 14, true)).toBe(expectedDos[index].dosDate);
      expect(view.getUint32(cursor + 16, true)).toBe(entries[index].crc32);
      expect(view.getUint32(cursor + 20, true)).toBe(0xffffffff);
      expect(view.getUint32(cursor + 24, true)).toBe(0xffffffff);
      const fileNameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      expect(view.getUint16(cursor + 32, true)).toBe(0);
      expect(view.getUint16(cursor + 34, true)).toBe(0);
      expect(view.getUint16(cursor + 36, true)).toBe(0);
      expect(view.getUint32(cursor + 38, true)).toBe(0);
      expect(view.getUint32(cursor + 42, true)).toBe(0xffffffff);
      const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + fileNameLength);
      expect(textDecoder.decode(nameBytes)).toBe(source.name);
      const centralExtraView = new DataView(bytes.buffer, bytes.byteOffset + cursor + 46 + fileNameLength, extraLength);
      expect(centralExtraView.getUint16(0, true)).toBe(ZIP64_EXTRA_HEADER_ID);
      expect(centralExtraView.getUint16(2, true)).toBe(24);
      expect(centralExtraView.getBigUint64(4, true)).toBe(BigInt(source.content.byteLength));
      expect(centralExtraView.getBigUint64(12, true)).toBe(BigInt(source.content.byteLength));
      expect(centralExtraView.getBigUint64(20, true)).toBe(localOffsets[index]);
      cursor = cursor + 46 + fileNameLength + extraLength;
    });

    const centralDirectorySize = BigInt(cursor - centralDirectoryOffset);
    const zip64EndOffset = cursor;
    expect(view.getUint32(cursor, true)).toBe(ZIP64_END_OF_CENTRAL_DIR_SIGNATURE);
    expect(view.getBigUint64(cursor + 24, true)).toBe(BigInt(sources.length));
    expect(view.getBigUint64(cursor + 32, true)).toBe(BigInt(sources.length));
    expect(view.getBigUint64(cursor + 40, true)).toBe(centralDirectorySize);
    expect(view.getBigUint64(cursor + 48, true)).toBe(BigInt(centralDirectoryOffset));
    cursor += 56;

    expect(view.getUint32(cursor, true)).toBe(ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE);
    expect(view.getUint32(cursor + 4, true)).toBe(0);
    expect(view.getBigUint64(cursor + 8, true)).toBe(BigInt(zip64EndOffset));
    expect(view.getUint32(cursor + 16, true)).toBe(1);
    cursor += 20;

    expect(view.getUint32(cursor, true)).toBe(END_OF_CENTRAL_DIR_SIGNATURE);
    expect(view.getUint16(cursor + 20, true)).toBe(0);
    cursor += 22;

    expect(cursor).toBe(bytes.byteLength);
  });
});
