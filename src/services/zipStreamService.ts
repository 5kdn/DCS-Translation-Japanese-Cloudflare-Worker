const ZIP_VERSION = 45;
const ZIP64_EXTRA_HEADER_ID = 0x0001;
const CENTRAL_FILE_HEADER_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
const ZIP64_END_OF_CENTRAL_DIR_SIGNATURE = 0x06064b50;
const ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE = 0x07064b50;

const textEncoder = new TextEncoder();

export interface ZipStreamEntry {
  name: string;
  content: Uint8Array;
  lastModified: Date;
}

export interface ZipStreamBuildResult {
  stream: ReadableStream<Uint8Array>;
  entries: ReadonlyArray<ZipEntryMeta>;
}

interface ZipEntryMeta {
  name: string;
  size: bigint;
  compressedSize: bigint;
  crc32: number;
}

/**
 * ZIP64 ストリームを生成する。
 */
export const buildZip64Stream = (sources: ReadonlyArray<ZipStreamEntry>): ZipStreamBuildResult => {
  const entries = sources.map((source) => {
    const crc = computeCrc32(source.content);
    return {
      name: source.name,
      content: source.content,
      lastModified: source.lastModified,
      crc32: crc,
      size: BigInt(source.content.byteLength),
    };
  });

  const centralRecords: Uint8Array[] = [];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let offset = 0n;
      for (const entry of entries) {
        const fileNameBytes = textEncoder.encode(entry.name);
        const { dosTime, dosDate } = toDosDateTime(entry.lastModified);

        const localExtra = createZip64LocalExtra(entry.size, entry.size);
        const localHeader = new Uint8Array(30 + fileNameBytes.length + localExtra.length);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, LOCAL_FILE_HEADER_SIGNATURE, true);
        localView.setUint16(4, ZIP_VERSION, true);
        localView.setUint16(6, 0, true); // general purpose bit flag
        localView.setUint16(8, 0, true); // compression method (store)
        localView.setUint16(10, dosTime, true);
        localView.setUint16(12, dosDate, true);
        localView.setUint32(14, entry.crc32 >>> 0, true);
        localView.setUint32(18, 0xffffffff, true);
        localView.setUint32(22, 0xffffffff, true);
        localView.setUint16(26, fileNameBytes.length, true);
        localView.setUint16(28, localExtra.length, true);
        localHeader.set(fileNameBytes, 30);
        localHeader.set(localExtra, 30 + fileNameBytes.length);

        controller.enqueue(localHeader);
        controller.enqueue(entry.content);

        const centralExtra = createZip64CentralExtra(entry.size, entry.size, offset);
        const centralRecord = new Uint8Array(46 + fileNameBytes.length + centralExtra.length);
        const centralView = new DataView(centralRecord.buffer);
        centralView.setUint32(0, CENTRAL_FILE_HEADER_SIGNATURE, true);
        centralView.setUint16(4, ZIP_VERSION, true); // version made by
        centralView.setUint16(6, ZIP_VERSION, true); // version needed
        centralView.setUint16(8, 0, true); // general flag
        centralView.setUint16(10, 0, true); // compression method
        centralView.setUint16(12, dosTime, true);
        centralView.setUint16(14, dosDate, true);
        centralView.setUint32(16, entry.crc32 >>> 0, true);
        centralView.setUint32(20, 0xffffffff, true);
        centralView.setUint32(24, 0xffffffff, true);
        centralView.setUint16(28, fileNameBytes.length, true);
        centralView.setUint16(30, centralExtra.length, true);
        centralView.setUint16(32, 0, true); // comment length
        centralView.setUint16(34, 0, true); // disk number start
        centralView.setUint16(36, 0, true); // internal file attributes
        centralView.setUint32(38, 0, true); // external file attributes
        centralView.setUint32(42, 0xffffffff, true);
        centralRecord.set(fileNameBytes, 46);
        centralRecord.set(centralExtra, 46 + fileNameBytes.length);

        centralRecords.push(centralRecord);
        offset += BigInt(localHeader.byteLength) + BigInt(entry.content.byteLength);
      }

      const centralOffset = offset;
      let centralSize = 0n;

      for (const record of centralRecords) {
        controller.enqueue(record);
        centralSize += BigInt(record.byteLength);
      }

      const zip64End = createZip64EndOfCentralDirectory(entries.length, centralSize, centralOffset);
      const zip64EndOffset = centralOffset + centralSize;
      const zip64Locator = createZip64EndOfCentralDirectoryLocator(zip64EndOffset);
      const eocd = createEndOfCentralDirectory();

      controller.enqueue(zip64End);
      controller.enqueue(zip64Locator);
      controller.enqueue(eocd);
      controller.close();
    },
  });

  const metadata: ZipEntryMeta[] = entries.map((entry) => ({
    name: entry.name,
    size: entry.size,
    compressedSize: entry.size,
    crc32: entry.crc32 >>> 0,
  }));

  return { stream, entries: metadata };
};

const createZip64LocalExtra = (uncompressed: bigint, compressed: bigint): Uint8Array => {
  const buffer = new ArrayBuffer(4 + 16);
  const view = new DataView(buffer);
  view.setUint16(0, ZIP64_EXTRA_HEADER_ID, true);
  view.setUint16(2, 16, true);
  setBigUint64(view, 4, uncompressed);
  setBigUint64(view, 12, compressed);
  return new Uint8Array(buffer);
};

const createZip64CentralExtra = (uncompressed: bigint, compressed: bigint, offset: bigint): Uint8Array => {
  const buffer = new ArrayBuffer(4 + 24);
  const view = new DataView(buffer);
  view.setUint16(0, ZIP64_EXTRA_HEADER_ID, true);
  view.setUint16(2, 24, true);
  setBigUint64(view, 4, uncompressed);
  setBigUint64(view, 12, compressed);
  setBigUint64(view, 20, offset);
  return new Uint8Array(buffer);
};

const createZip64EndOfCentralDirectory = (entryCount: number, centralSize: bigint, centralOffset: bigint): Uint8Array => {
  const buffer = new ArrayBuffer(56);
  const view = new DataView(buffer);
  view.setUint32(0, ZIP64_END_OF_CENTRAL_DIR_SIGNATURE, true);
  setBigUint64(view, 4, 44n);
  view.setUint16(12, ZIP_VERSION, true);
  view.setUint16(14, ZIP_VERSION, true);
  view.setUint32(16, 0, true);
  view.setUint32(20, 0, true);
  setBigUint64(view, 24, BigInt(entryCount));
  setBigUint64(view, 32, BigInt(entryCount));
  setBigUint64(view, 40, centralSize);
  setBigUint64(view, 48, centralOffset);
  return new Uint8Array(buffer);
};

const createZip64EndOfCentralDirectoryLocator = (zip64EndOffset: bigint): Uint8Array => {
  const buffer = new ArrayBuffer(20);
  const view = new DataView(buffer);
  view.setUint32(0, ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE, true);
  view.setUint32(4, 0, true);
  setBigUint64(view, 8, zip64EndOffset);
  view.setUint32(16, 1, true);
  return new Uint8Array(buffer);
};

const createEndOfCentralDirectory = (): Uint8Array => {
  const buffer = new ArrayBuffer(22);
  const view = new DataView(buffer);
  view.setUint32(0, END_OF_CENTRAL_DIR_SIGNATURE, true);
  view.setUint16(4, 0xffff, true);
  view.setUint16(6, 0xffff, true);
  view.setUint16(8, 0xffff, true);
  view.setUint16(10, 0xffff, true);
  view.setUint32(12, 0xffffffff, true);
  view.setUint32(16, 0xffffffff, true);
  view.setUint16(20, 0, true);
  return new Uint8Array(buffer);
};

const toDosDateTime = (date: Date): { dosTime: number; dosDate: number } => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = Math.floor(date.getUTCSeconds() / 2);

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hour << 11) | (minute << 5) | second;
  return { dosDate, dosTime };
};

const setBigUint64 = (view: DataView, byteOffset: number, value: bigint): void => {
  view.setBigUint64(byteOffset, value, true);
};

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      if ((c & 1) !== 0) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c >>>= 1;
      }
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const computeCrc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of data) {
    const idx = (crc ^ byte) & 0xff;
    const tableValue = CRC32_TABLE[idx];
    if (tableValue === undefined) {
      throw new RangeError('CRC32_TABLE index is invalid');
    }
    crc = tableValue ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
