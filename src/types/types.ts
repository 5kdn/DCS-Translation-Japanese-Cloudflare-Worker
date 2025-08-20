export interface TreeItem {
  path: string;
  mode: string;
  type: 'blob';
  sha: string;
  size?: number | undefined;
  url?: string | undefined;
}
