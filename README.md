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
- 本番エントリポイントでのローカル起動: `pnpm start`
- デプロイ前のビルド・設定確認: `pnpm run deploy --dry-run`
- 本番デプロイ: GitHub Actions（Release 公開時、または手動実行）
- 型定義生成: `pnpm cf-typegen`
- 静的検証: `pnpm check`, `pnpm typecheck`, `pnpm lint`, `pnpm fmt`
- テスト実行: `pnpm test`

### Cloudflare CLI

Node.js 24 と pnpm 10 を使用します。Worker の設定は `cloudflare.config.ts`、
ビルドと開発サーバーの設定は `vite.config.mts` で管理しています。
cf と Cloudflare Vite プラグインは beta 版のため、動作確認済みのバージョンに固定しています。

`pnpm dev` は `src/index.dev.ts`、`pnpm start` とデプロイは `src/index.ts` を使用します。
開発サーバーの URL は `http://127.0.0.1:8787` です。
ローカルのシークレットは `.dev.vars` に設定してください（Git 管理対象外）。
ローカル D1 の既存データは自動移行されないため、必要に応じて初期化・移行してください。

`pnpm cf-typegen` は `.cloudflare/types/index.d.ts` を生成します。
設定変更時は再生成し、この型定義もコミットしてください。

ローカルから本番へデプロイする場合は、`CLOUDFLARE_ACCOUNT_ID` と
`CLOUDFLARE_API_TOKEN` を設定して `pnpm run deploy` を実行します。
GitHub Actions は同名のリポジトリシークレットと `TARGET_GH_SECRET` を使用します。
D1 の ID・Cron・環境変数は移行前の設定を維持しています。

## サードパーティライセンス

本プロジェクトには、外部のオープンソースソフトウェアが含まれています。
各ライブラリのライセンス情報は以下のファイルに記載しています。

[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES/THIRD-PARTY-NOTICES.md)
