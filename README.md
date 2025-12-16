# DCS Translation Japanese Cloudflare Worker

[DCS TranslationJapanese](https://github.com/5kdn/DCS-Translation-Japanese) リポジトリの内容に対する参照・操作を提供する API サーバー。

## エンドポイント

- `/health`（疎通確認）
- `/tree`（リポジトリツリー取得）
- `/issue`
  - `/list`（GitHub の Issue 一覧を取得）
  - `/create`（GitHub の Issue を作成）
- `/create-pr`（ファイル差分から PR 作成）
- `/download-zip`（指定パスの ZIP 生成）
- `/download-file-paths` (指定パスの GitHub Raw URL一覧を返却)
- `/docs`（Swagger UI）

## 実行と開発手順

- 依存関係の導入: `pnpm install`
- ローカル開発サーバー: `pnpm dev`
- 本番デプロイ: github workflow
- 型定義生成: `pnpm cf-typegen`
- 静的検証: `pnpm check`, `pnpm lint`, `pnpm fmt`
- テスト実行: `pnpm test`

## サードパーティライセンス

本プロジェクトには、外部のオープンソースソフトウェアが含まれています。
各ライブラリのライセンス情報は以下のファイルに記載しています。

[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES/THIRD-PARTY-NOTICES.md)
