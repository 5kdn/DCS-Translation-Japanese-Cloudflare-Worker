/**
 * Viteの?rawで読み込むSQLファイルのモジュール型宣言。
 *
 * SQLファイルの内容を文字列のデフォルトエクスポートとして扱い、テストでのインポートを型検査可能にする。
 */
declare module '*.sql?raw' {
  /** SQLファイルの内容を加工せず読み込んだ文字列。 */
  const sql: string;
  export default sql;
}
