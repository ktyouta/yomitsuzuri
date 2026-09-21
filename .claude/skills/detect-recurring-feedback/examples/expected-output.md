# Expected Output — Detect Recurring Feedback

---

## ケース1: 複数の recurring pattern を検出

### 状況
- 過去の会話で「border-stone-200 を消さないで」「text-sm は使わないで」が複数回発生している
- `getItemById` のような By 系メソッド名も毎回指摘されている

### 出力

```
## Recurring Feedback Analysis

### 検出ルール

| # | パターン | 発生回数 | 分類 |
|---|---|---|---|
| 1 | ボタン・ラベルに `text-sm` を使用している | 3回 | UI スタイル規約 |
| 2 | バックエンドのメソッド名に `ById` / `ByName` 等のパラメータ情報を含む | 3回 | Naming 規約 |
| 3 | `border-stone-200` がベースクラスから削除されている | 2回 | UI スタイル保護 |

### 推奨アクション

| 対象 Skill | アクション |
|---|---|
| `frontend-review` | `text-sm` をボタン・ラベルに使った場合を違反として明記 |
| `backend-review` | メソッド名のパラメータ情報禁止ルールのチェック項目を強化 |
| `frontend-review` | `border-stone-200` を削除した場合のチェック項目を追加 |

### 改善理由
- 3つのパターンはすべて3回以上繰り返されており、Skill 化の基準（3回以上）を満たす
- `frontend-review` / `backend-review` のチェックで検出できていないため、チェック項目の追加が有効
```

---

## ケース2: 単発指摘のみで recurring pattern なし

### 出力

```
## Recurring Feedback Analysis

### 検出ルール
- 繰り返しパターンは検出されませんでした（各指摘は1回のみ）

### 推奨アクション
- なし（単発指摘は Skill 化しない）
```
