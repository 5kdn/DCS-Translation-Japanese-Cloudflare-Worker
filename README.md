# DCS Translation Japanese Cloudflare Worker

[dcs-translation-japanese/translations](https://github.com/dcs-translation-japanese/translations) リポジトリの内容に対する参照・操作を提供する API サーバー。

## API URL

正式URL: [https://api.dcs-translation-japanese.workers.dev](https://api.dcs-translation-japanese.workers.dev)

エンドポイント・パラメータ・応答仕様はSwagger UIを参照してください。

- [Swagger UI（v1）](https://api.dcs-translation-japanese.workers.dev/docs)
- [Swagger UI（v2）](https://api.dcs-translation-japanese.workers.dev/v2/docs)
- [OpenAPI（v1）](https://api.dcs-translation-japanese.workers.dev/openapi.json)
- [OpenAPI（v2）](https://api.dcs-translation-japanese.workers.dev/v2/openapi.json)
- [旧URL](https://dcs-translation-japanese-cloudflare-worker.dcs-translation-japanese.workers.dev)

> [!IMPORTANT]
> 旧URLは非推奨ですが、既存クライアント向けに提供を継続します。新規利用には正式URLを使用してください。
>
> 旧URLの廃止期限は **2027年12月31日23:59:59（日本時間）** です。それまでに正式URLへ移行してください。

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

Node.js 24 と pnpm 11 系を使用します。pnpm のバージョン範囲は `package.json` の `devEngines.packageManager` に指定し、GitHub Actions でも同じ指定を使用します。Worker の設定は `cloudflare.config.ts`、ビルドと開発サーバーの設定は `vite.config.mts` で管理しています。
cf と Cloudflare Vite プラグインは beta 版のため、動作確認済みのバージョンに固定しています。

`pnpm dev` は `src/index.dev.ts`、`pnpm start` とデプロイは `src/index.ts` を使用します。
開発サーバーの URL は `http://127.0.0.1:8787` です。
ローカルのシークレットは `.dev.vars` に設定してください（Git 管理対象外）。
ローカル D1 の既存データは自動移行されないため、必要に応じて初期化・移行してください。

`pnpm generate` は開発・ビルド用生成処理の共通入口です。
現在は `pnpm cf-typegen` を呼び出し、`.cloudflare/types/index.d.ts` を生成します。
設定や依存関係を変更した場合、エディターで型定義が見つからない場合は再実行してください。
v2 API は v1 と同じ `@hono/zod-openapi` を使用します。`src/api/v2/routes/` 配下の各操作ファイルと共有スキーマを編集し、`pnpm test:contract` で確認してください。入力検証と型は Zod 定義を共有し、公開する OpenAPI は Hono が実行時に組み立てます。コードの自動生成スクリプト・生成ファイルはありません。

`pnpm dev`、`pnpm start`、`pnpm typecheck`、`pnpm test`、`pnpm test:unit`、`pnpm test:integration`、`pnpm test:e2e`、`pnpm run deploy` は、実行前に必ず `pnpm generate` を実行します。生成に失敗した場合は後続処理を実行しません。
CI の独立した各ジョブとデプロイも同じスクリプトを使うため、生成物がない環境から実行できます。
ビルドの検証には `pnpm run deploy --dry-run` を使用します。

`.cloudflare/` 以下の生成物は Git 管理せず、コミットも差分チェックも不要です。
再生成に必要な設定・入力・`pnpm-lock.yaml` は引き続き Git 管理します。
`THIRD-PARTY-NOTICES` はこの方針の対象外で、従来どおり `pnpm generate-licenses` で生成し、Git 管理と既存 CI による検証を維持します。

本番反映は Release 公開時の GitHub Actions を使用します。手動で反映する場合も `Deploy to Cloudflare` Workflow を実行します。
GitHub Actions は `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`TARGET_GH_SECRET` のリポジトリシークレットを使用します。

### v2の匿名書き込みと共有回数制限

`POST /v2/issues`、`PATCH /v2/issues/{number}`、`POST /v2/prs` はログイン不要です。Issueの編集は、作成者や作成経路・状態によらず、設定された対象リポジトリのタイトル・本文だけを変更します。PRをIssueとして編集することはできません。

3操作は送信元IPごとに、直近300秒の合計10回までの枠を共有します。入力エラーやGitHub側の失敗も数え、超過時は `429 application/problem+json` と整数秒の `Retry-After` を返します。拒否したアクセスでは待ち時間を延長しません。読み取り・OIDCメタデータ更新・旧APIはこの枠に含みません。

履歴は既存の `TREE_METADATA_DB` に保存し、D1のトランザクションでWorkerインスタンス間の同時実行を制御します。保存するのはIPのSHA-256ハッシュと試行日時で、期限切れ履歴は次の書き込みリクエストで削除します。`CF-Connecting-IP` またはDBを使えない場合は、制限を省略せず503で書き込みを拒否します。

デプロイ前に、`migrations/0003_v2_write_rate_limits.sql` を `TREE_METADATA_DB` に適用してください。既存データの削除は不要です。`0002_used_jti.sql` は別の `JWT_REPLAY_DB` 用なので、このDBへまとめて適用しないでください。ローカル開発でも同じテーブルが必要です。

PRは許可されたファイルパスの追加・更新・削除から作成します。既存ブランチ名との衝突は409で拒否し、既存ブランチの上書きやforce pushは行いません。途中でGitHub操作が失敗すると作成済みブランチが残るため、再送時は新しいブランチ名を指定してください。

第三者もIssueを書き換えられます。同じIPの利用者は枠を共有し、旧API経由の書き込みにはこの制限が適用されません。

### メタデータ送信のOIDC subject

`TREE_METADATA_OIDC_SUBJECT` は、translationsのOIDC設定と実claimで確認した `repo:dcs-translation-japanese@346855332/translations@1098927315:pull_request` を指定します。
GitHubのimmutable subject形式に従い、ownerとrepositoryのIDも完全一致で照合します。
移管・改名後はこの値を再確認してください。未設定時は送信を拒否します。
issuer・`tree-metadata` audience・repository・owner・master・workflowの照合と、jtiの再利用拒否も維持します。

## サードパーティライセンス

本プロジェクトには、外部のオープンソースソフトウェアが含まれています。
各ライブラリのライセンス情報は以下のファイルに記載しています。

[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES/THIRD-PARTY-NOTICES.md)
