---
name: db-naming-review
description: |
  DBテーブル設計・Drizzle ORM スキーマ定義を行った直後に、命名規則の遵守を確認する。

  以下のような場合に必ず呼び出す：
  - Drizzle ORM でテーブル定義を新規作成・修正したとき
  - ER図・データモデルを設計・提案するとき
  - マイグレーション SQL を生成・レビューするとき

  以下の場合は使用しない：
  - テーブル定義を含まないバックエンド変更
  - 調査・説明のみの場合
version: 1.0.0
---

# DB Naming Review Skill

## Overview

DBテーブル名がプロジェクトの命名規則に従っているかチェックする。

---

## 命名規則

| データ種別 | サフィックス | 例 |
|---|---|---|
| マスターデータ（変更頻度が低い参照データ） | `_master` | `category_master`, `user_master`, `role_master` |
| トランザクションデータ（業務上発生するイベント・履歴） | `_transaction` | `order_transaction`, `log_transaction`, `payment_transaction` |

---

## 共通カラム規約

全テーブルに以下の3カラムを必ず含める。

```ts
deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
createdAt: text("created_at").notNull(),
updatedAt: text("updated_at").notNull(),
```

- `createdAt` / `updatedAt` の値は `new Date().toISOString()` で生成する
- INSERT 時は `createdAt` と `updatedAt` に同じ値を設定する
- UPDATE 時は `updatedAt` のみ `new Date().toISOString()` で更新する

---

## Check Instructions

- テーブル名に `_master` または `_transaction` サフィックスが付いているか
- データ種別に対して正しいサフィックスが選ばれているか
  - 参照・設定データ → `_master`
  - 記録・履歴・イベントデータ → `_transaction`
- サフィックスなしのテーブル名（例: `users`, `items`）が残っていないか
- 全テーブルに `deleteFlg` / `createdAt` / `updatedAt` の3カラムが含まれているか

---

## Procedure

1. 変更・追加されたテーブル定義を確認する
2. 各テーブル名をチェック項目と照合する
3. 以下の形式で報告する

---

## Output Format

違反がある場合：

```
## DB Naming Review 結果

### 違反あり
- **テーブル名**: [現在の名前]
- **問題**: サフィックスがない / 種別に合わないサフィックス / 共通カラム不足
- **修正案**: [修正内容]
```

違反がない場合：

```
## DB Naming Review 結果

チェック完了。命名規則・共通カラムに問題なし。
```
