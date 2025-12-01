/**
 * バッチダウンロード時の制限値を管理する。
 */
export class DownloadLimits {
  constructor(
    public readonly maxFileCount: number,
    public readonly maxFilePathCount: number,
    public readonly maxTotalBytes: number,
    public readonly maxSingleBytes: number,
  ) {}
}

/**
 * デフォルト制限値を提供する。
 */
export const DEFAULT_DOWNLOAD_LIMITS = new DownloadLimits(
  50,
  300,
  1_073_741_824, // 1 GiB
  104_857_600, // 100 MiB
);
