# Changelog

## [2.0.0](https://github.com/dcs-translation-japanese/api/compare/v1.5.5...v2.0.0) (2026-11-07)


### ⚠ BREAKING CHANGES

* **v2:** GET /v2/tree now requires following page.nextCursor until null; the snapshot item limit is 10,000.

### Features

* v2 APIのZod定義・共通応答・契約テスト基盤を整備する ([#167](https://github.com/dcs-translation-japanese/api/issues/167)) ([52ed38d](https://github.com/dcs-translation-japanese/api/commit/52ed38d30cac77fef02cdf0cfa807f77af7a32e0))
* **v2:** Issue作成・編集とPR作成に共有回数制限を実装 ([#169](https://github.com/dcs-translation-japanese/api/issues/169)) ([dedfff8](https://github.com/dcs-translation-japanese/api/commit/dedfff8aaf458ef438c50f81acea53a839d59fb3))
* **v2:** OIDC限定のメタデータ一括更新を実装 ([#165](https://github.com/dcs-translation-japanese/api/issues/165)) ([#170](https://github.com/dcs-translation-japanese/api/issues/170)) ([cc4849b](https://github.com/dcs-translation-japanese/api/commit/cc4849b69667510fa55298c5a73aa8dc34270cd6))
* **v2:** tree取得APIにコミット固定のページネーションを追加 ([#176](https://github.com/dcs-translation-japanese/api/issues/176)) ([b8d45f7](https://github.com/dcs-translation-japanese/api/commit/b8d45f785bda5ca99ad32f804d10cf62d2adc8ba))
* **v2:** 認証不要の読み取りAPIを実装 ([#168](https://github.com/dcs-translation-japanese/api/issues/168)) ([48f7cbd](https://github.com/dcs-translation-japanese/api/commit/48f7cbd4e1d08bfee63a66a3ce1fab67ef7672e0)), closes [#163](https://github.com/dcs-translation-japanese/api/issues/163)
* 正式API URLを追加し旧URLの並列提供を維持する ([#160](https://github.com/dcs-translation-japanese/api/issues/160)) ([bcf9b68](https://github.com/dcs-translation-japanese/api/commit/bcf9b68a7ba4fc68f366b0ed525bf5d58d1ce78d))


### Bug Fixes

* paginate GitHub issue listing ([#173](https://github.com/dcs-translation-japanese/api/issues/173)) ([f2cbcd7](https://github.com/dcs-translation-japanese/api/commit/f2cbcd709bb47c0d2b038b95b29e99e141d4919c))
* translationsのOrg参照先と検証済みinstallationの公開手順を準備する ([#145](https://github.com/dcs-translation-japanese/api/issues/145)) ([0abadf9](https://github.com/dcs-translation-japanese/api/commit/0abadf94bddba20dab8d1af7914acc3d4b62b2f1))
* **v2:** ツリー全件取得の制約を公開仕様に明記する ([#166](https://github.com/dcs-translation-japanese/api/issues/166)) ([#171](https://github.com/dcs-translation-japanese/api/issues/171)) ([94e9c67](https://github.com/dcs-translation-japanese/api/commit/94e9c674c5ad21e4ad7108f2f1acfe0b2fd29234))
* verify the immutable translations OIDC subject ([#150](https://github.com/dcs-translation-japanese/api/issues/150)) ([9b82d76](https://github.com/dcs-translation-japanese/api/commit/9b82d76f8cb859e8a2a42ed88bcd2d042973e827))
* 移管期間中の新旧Pages originを許可する ([#144](https://github.com/dcs-translation-japanese/api/issues/144)) ([8c4b7c6](https://github.com/dcs-translation-japanese/api/commit/8c4b7c6fe9516fc6c3661366b94ead4a382c211e))

## [1.5.5](https://github.com/dcs-translation-japanese/api/compare/v1.5.4...v1.5.5) (2026-10-28)


### Bug Fixes

* **deps:** bump hono from 4.13.13 to 4.13.14 in the hono-and-openapi group ([305209e](https://github.com/dcs-translation-japanese/api/commit/305209e5276d99565b8bc9ad092c368783788bb4))

## [1.5.4](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.5.3...v1.5.4) (2026-10-23)


### Bug Fixes

* **deps:** bump jose from 6.2.3 to 6.2.4 ([#108](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/108)) ([9f6424a](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/9f6424adde52fb65f4ca39378ddd70c360e3666c))
* **deps:** bump the hono-and-openapi group across 1 directory with 2 updates ([#105](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/105)) ([96caf0e](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/96caf0e7695132f77e78d52474b617c4bc20279c))
* **hooks:** run pnpm directly without Corepack ([#135](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/135)) ([2482d60](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/2482d600ce3846330ea1addf6b9fbfdfcdb3de7b)), closes [#134](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/134)

## [1.5.3](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.5.2...v1.5.3) (2026-05-20)


### Bug Fixes

* **deps:** bump fflate from 0.8.2 to 0.8.3 ([#83](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/83)) ([dd9f82b](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/dd9f82b7a60af83dc5249ad3f2b04a5238b3c918))
* **deps:** bump jose from 6.1.3 to 6.2.3 ([#80](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/80)) ([1db1862](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/1db18620c4d8cbab732103a179ac6227f8fcfdea))
* **deps:** bump the hono-and-openapi group across 1 directory with 3 updates ([#86](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/86)) ([f72c729](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/f72c729af9b898040b4a8b050af842524c526b8e))

## [1.5.2](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.5.1...v1.5.2) (2026-02-18)


### Bug Fixes

* **deps:** bump the hono-and-openapi group across 1 directory with 3 updates ([#63](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/63)) ([ce72d7a](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/ce72d7a5f47ab9c1a6161a0ea6f21713e9625b9f))

## [1.5.1](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.5.0...v1.5.1) (2026-01-14)


### Fixes

* JWT検証ミドルウェアのalg扱いに関する脆弱性(CVE-2026-22817, CVE-2026-22818)を解消するため、Honoを4.11.4へ更新する closes [#48](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/pull/48)

## [1.5.0](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.4.0...v1.5.0) (2026-01-05)


### Features

* issue 関連のエントリーポイントを整理 ([#35](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/35)) ([be0e67c](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/be0e67c5258db8b53c83178f628de38e71505abd))
* ツリー/メタデータ更新とJWT検証を追加 ([#43](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/43)) ([8e7773d](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/8e7773d9da650a79d6642dc252c1cdc18a47d167)), closes [#42](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/42)

## [1.4.0](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.3.0...v1.4.0) (2025-12-13)


### Features

* issue 23 ([#24](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/24)) ([eedac55](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/eedac5546c63ef75bf3b165a97b483a1b7613b13)), closes [#23](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/23)

## [1.3.0](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.2.0...v1.3.0) (2025-12-11)


### Features

* add /create-issue endpoint ([#20](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/20)) ([4c216eb](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/4c216eb6b4e6001b7f99d153dedb5f84d43314b6)), closes [#19](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/19)
* update pre-commit ([#22](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/22)) ([6af7d3d](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/6af7d3d48a7dea94c3b4ade6004ef6f8d8529758))

## [1.2.0](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.1.0...v1.2.0) (2025-12-01)


### Features

* add download file paths entry ([#15](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/15)) ([3fc63c2](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/3fc63c2f3ca1626ff4a57ed4ce9b10aa1ca9fb6b))

## [1.1.0](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v1.0.0...v1.1.0) (2025-12-01)


### Features

* paginate GitHub downloads in 100-file batches ([#13](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/issues/13)) ([728a733](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/728a7333bd5de8296ef7dae88e980b7600aff596))

## [1.0.0](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/compare/v0.0.1...v1.0.0) (2025-11-18)


### Features

* /create-pr エンドポイントを追加 ([5c1f58b](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/5c1f58be7a0962050993e643b8459d2606f5ccf5))
* /download-files エンドポイントを追加 ([e653782](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/e6537823147cb1f4bae17f4d0754ff8c3d0e7e97))
* /tree エンドポイントを追加 ([f7a3a08](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/f7a3a08299130bb9572e895212427b1914bde5df))
* GitHubツリー取得メソッドを追加 ([85226f9](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/85226f9454e41c4f8d13c784c8b1673f0bb7fd29))
* Swagger UIドキュメントルートと統合テストを追加 ([12bb82e](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/12bb82e9149b355ce6efc53667ee636638993ae3))
* ヘルスチェックエンドポイントと統合テストを追加 ([b7037c9](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/b7037c9a59f27cd8b8409cf725b424e1d712fc73))


### Miscellaneous Chores

* release 1.0.0 ([dea80cd](https://github.com/5kdn/DCS-Translation-Japanese-Cloudflare-Worker/commit/dea80cd6c0f48fef7cfe50ac1fb87675e4dce418))
