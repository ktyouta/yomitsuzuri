---
name: resource-authz-review
description: |
  バックエンドのコード変更が完了した直後に、リソース認可の観点でチェックを行う。
  「認証済みユーザーが自分以外のリソースにアクセス・操作できる穴」を検出する。

  以下のような場合に必ず呼び出す：
  - バックエンドの Controller / Usecase / Repository を新規作成・修正したとき

  以下の場合は使用しない：
  - フロントエンドのみの変更
  - 調査・説明・設計相談のみの場合
version: 1.0.0
---

# Resource Authorization Review Skill

## Overview

バックエンド実装後に、リソース認可の違反パターンをチェックする。

「認証済みユーザーが自分以外のリソースにアクセス・操作できる穴」を検出することが目的。

---

## Check Instructions

### パスパラメータの userId と認証済み userId の照合

- Controller でパスパラメータに `userId` / `id` を受け取る場合、`c.get('user').userId` との一致確認があるか
- 一致確認なしに Repository に渡している場合、他ユーザーのリソースを操作できる
- 注意: 管理者専用エンドポイント（RBAC 導入後に別途チェック対象となる）は現時点では「要確認」として記録する

### リソース ID パスパラメータの所有者確認

- `userId` 以外のリソース ID（`itemId`・`recordId` 等）をパスパラメータで受け取る場合、そのリソースが認証済みユーザーに属しているかを確認しているか
- 確認方法（いずれか）:
  - Repository のクエリ WHERE 句に `eq(table.userId, authenticatedUserId.value)` を含める（推奨）
  - 取得後に `resource.userId !== authenticatedUser.userId` の場合に 403 / 404 を返す
- リソース ID のみで取得（userId フィルタなし）は他ユーザーのリソースを操作できる

### Repository に渡す userId の出所

- SELECT / UPDATE / DELETE に使う userId は必ず `c.get('user').userId` 経由で来ているか
- パスパラメータやリクエストボディの userId を照合なしで Repository に渡していないか

### Repository の WHERE 句に userId フィルタが存在するか

- SELECT / UPDATE / DELETE の WHERE 句に `eq(table.userId, userId.value)` 等の userId フィルタが含まれているか
- userId フィルタがない場合、全ユーザーのデータにアクセス・操作できる

---

## Procedure

1. 変更されたバックエンドファイルを確認する
2. `authMiddleware` が適用されているエンドポイントのみを対象とする（公開エンドポイントは対象外）
3. 各チェック項目を照合する
4. 以下の形式で報告する

---

## Output Format

違反がある場合：

```
## Resource Authorization Review 結果

### 違反あり
- **ファイル**: [ファイルパス:行番号]
- **違反内容**: 具体的な問題
- **修正方針**: 修正の方向性
```

違反がない場合：

```
## Resource Authorization Review 結果

チェック完了。問題なし。
```
