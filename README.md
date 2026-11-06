# DCS Translation Japanese Cloudflare Worker

[dcs-translation-japanese/translations](https://github.com/dcs-translation-japanese/translations) リポジトリの内容に対する参照・操作を提供する API サーバー。

## API URL

正式URL: [https://api.dcs-translation-japanese.workers.dev](https://api.dcs-translation-japanese.workers.dev)

- [APIドキュメント](https://api.dcs-translation-japanese.workers.dev/docs)
- [OpenAPI](https://api.dcs-translation-japanese.workers.dev/openapi.json)
- [旧URL](https://dcs-translation-japanese-cloudflare-worker.dcs-translation-japanese.workers.dev)

> [!IMPORTANT]
> 旧URLは非推奨ですが、既存クライアント向けに提供を継続します。新規利用には正式URLを使用してください。
>
> 旧URLの廃止期限は **2027年12月31日23:59:59（日本時間）** です。それまでに正式URLへ移行してください。

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

- 初回セットアップ: `pnpm install --frozen-lockfile` → `pnpm generate`
- ローカル開発サーバー: `pnpm dev`
- 本番エントリポイントでのローカル起動: `pnpm start`
- デプロイ前のビルド・設定確認: `pnpm run deploy --dry-run`
- 本番デプロイ: GitHub Actions（Release 公開時、または手動実行）
- 開発・ビルド用生成物の再生成: `pnpm generate`
- 静的検証: `pnpm check`, `pnpm typecheck`, `pnpm lint`, `pnpm fmt`
- テスト実行: `pnpm test`

### Cloudflare CLI

Node.js 24 と pnpm 10 を使用します。Worker の設定は `cloudflare.config.ts`、ビルドと開発サーバーの設定は `vite.config.mts` で管理しています。
cf と Cloudflare Vite プラグインは beta 版のため、動作確認済みのバージョンに固定しています。

`pnpm dev` は `src/index.dev.ts`、`pnpm start` とデプロイは `src/index.ts` を使用します。
開発サーバーの URL は `http://127.0.0.1:8787` です。
ローカルのシークレットは `.dev.vars` に設定してください（Git 管理対象外）。
ローカル D1 の既存データは自動移行されないため、必要に応じて初期化・移行してください。

`pnpm generate` は開発・ビルド用生成処理の共通入口です。
現在は `pnpm cf-typegen` を呼び出し、`.cloudflare/types/index.d.ts` を生成します。
設定や依存関係を変更した場合、エディターで型定義が見つからない場合は再実行してください。
今後の生成処理も `generate` スクリプトに追加します。

`pnpm dev`、`pnpm start`、`pnpm typecheck`、`pnpm test`、`pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e`、`pnpm run deploy` は、実行前に必ず `pnpm generate` を実行します。生成に失敗した場合は後続処理を実行しません。
CI の独立した各ジョブとデプロイも同じスクリプトを使うため、生成物がない環境から実行できます。
ビルドの検証には `pnpm run deploy --dry-run` を使用します。

`.cloudflare/` 以下の生成物は Git 管理せず、コミットも差分チェックも不要です。
再生成に必要な設定・入力・`pnpm-lock.yaml` は引き続き Git 管理します。
`THIRD-PARTY-NOTICES` はこの方針の対象外で、従来どおり `pnpm generate-licenses` で生成し、Git 管理と既存 CI による検証を維持します。

本番反映は Release 公開時の GitHub Actions を使用します。手動で反映する場合も `Deploy to Cloudflare` Workflow を実行します。
GitHub Actions は `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`TARGET_GH_SECRET` のリポジトリシークレットを使用します。

### メタデータ送信のOIDC subject

`TREE_METADATA_OIDC_SUBJECT` は、translationsのOIDC設定と実claimで確認した `repo:dcs-translation-japanese@346855332/translations@1098927315:pull_request` を指定します。
GitHubのimmutable subject形式に従い、ownerとrepositoryのIDも完全一致で照合します。
移管・改名後はこの値を再確認してください。未設定時は送信を拒否します。
issuer・`tree-metadata` audience・repository・owner・master・workflowの照合と、jtiの再利用拒否も維持します。

## サードパーティライセンス

本プロジェクトには、外部のオープンソースソフトウェアが含まれています。
各ライブラリのライセンス情報は以下のファイルに記載しています。

[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES/THIRD-PARTY-NOTICES.md)
