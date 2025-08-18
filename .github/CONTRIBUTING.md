# CONTRIBUTING

このリポジトリへの貢献に関心をお寄せいただきありがとうございます。以下のガイドラインに従って、開発・レビュー・リリースに参加してください。

---

## 方針の要約（重要）

- **リポジトリフロー:** GitHub Flow
- **リポジトリ構成:** 単一リポジトリ（モノレポ）
- **デプロイ対象:** `master` ブランチのみ（常にデプロイ可能状態）
- **マージ方式:** **Squash and Merge** をデフォルト
- **コミット/PRタイトル:** [Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) 準拠
- **`master` への取り込み手順:**
  1. 作業ブランチを作成
  2. 作業ブランチにコミット
  3. Pull Request (PR) を作成
  4. テスト・CI・レビューをクリア
  5. `master` へ **Squash Merge**

---

## 1. 開発環境

| 項目                     | 推奨バージョン / 内容 |
|--------------------------|-----------------------|
| IDE                      | Visual Studio Code    |
| Node 言語バージョン      | 24                    |
| パッケージマネージャー   | pnpm                  |

## 2. Issue と機能要望

- バグ報告や機能提案は [Issues](../../../issues) に登録してください。
- 再現手順、環境、期待動作を明確に記載してください。

## ブランチ運用（GitHub Flow）

- 基本ブランチは `master` です。`master` は常に **デプロイ可能** な状態を保ちます。
- 作業は課題単位で **短命ブランチ** を切って進めます。
  - 例: `feat/short-description`, `fix/issue-123`, `docs/update-contributing`
- `master` から分岐 → 変更 → PR → レビュー/CI 通過 → **Squash Merge** → `master` へ反映。

### コミット & PR タイトル規約（Conventional Commits）

- 形式: `type(scope): summary`
- 主な `type`: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- 例:
  - `feat(api): add user search endpoint`
  - `fix(db): handle null on migration`
  - `docs: update README for setup with pnpm`

## 4. コーディング規約

- **.editorconfig** に従ってください。
- 非同期コードは `async/await` を使用。

## 5. テスト

```bash
pnpm i
pnpm test
```

新機能またはバグ修正には 単体テスト を必ず追加。

## 6. Pull Request

Pull Request は release-please に従って作成します。

squash-commit として master に取り込まれます。

PR本文に「目的」「変更内容」「テスト方法」を明記してください。

> **PR タイトル** は Squash 時にコミットメッセージとして採用されるため、Conventional Commits に準拠してください。

## 7. ライセンス

提供コードは、このプロジェクトの [LICENSE](../LICENSE) に従います。
