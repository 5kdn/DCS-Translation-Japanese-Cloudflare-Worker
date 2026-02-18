# Changelog

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
