# Expected Output — Improve Skills

---

## ケース1: trigger word 不足・examples なし

### ユーザー入力

```
frontend-review の精度を改善して
```

### 出力

```
## Improve Skill: frontend-review

### 問題点

| # | 問題 | 詳細 |
|---|---|---|
| 1 | trigger word が弱い | 「フロントエンドのコンポーネントを修正したとき」のような自然なトリガーが不足 |
| 2 | expected-output.md がない | Claude が期待する出力形式を Few-shot で学習できない |
| 3 | `text-sm` 違反の判定基準が曖昧 | 「副次的アクションのみ許可」の定義が実装例なしでは判定しにくい |

### 改善理由
- expected-output.md がないため、Claude が出力形式を会話ごとに自己判断している
- `text-sm` チェックは「副次的アクション」の定義が曖昧で、毎回ユーザーから指摘されている

### 修正内容

1. description の trigger word に以下を追加：
   - 「フロントエンドのコンポーネントを作った」
   - 「画面を実装した」

2. examples/expected-output.md を新規作成（違反あり・違反なしの2ケース）

3. `text-sm` チェック項目を以下に強化：
   - 「ユーザーが能動的に操作するすべての要素（ボタン・ラベル等）は `text-base` 以上」
   - 「副次的アクション（やり直す・キャンセル等）のみ `text-sm` を許可」

### 修正後サンプル（description の trigger word 追記分）

```yaml
主なトリガーワード（追加分）:
- 「フロントエンドのコンポーネントを作った」
- 「画面を実装した」
- 「UI を実装した」
```

承認後に適用します。
```

---

## ケース2: 責務が大きすぎる場合の分割提案

### ユーザー入力

```
fullstack-review の Skill を改善して
```

### 出力

```
## Improve Skill: fullstack-review

### 問題点
- 1 Skill にバックエンド・フロントエンド・RPC・コメントの4責務が混在している
- チェック項目が多すぎて Claude が全件を確認せずに出力している

### 改善理由
- 単一責務の原則に違反しており、漏れが発生しやすい構造

### 修正内容（分割提案）

以下の4 Skill に分割することを提案します：

| 新 Skill | 担当 |
|---|---|
| `backend-review` | Controller / Service / Repository のレイヤー設計 |
| `frontend-review` | コンポーネント設計・Presentational 純粋性 |
| `rpc-review` | RPC 型安全性・API クライアント使い分け |
| `comments-review` | WHAT / WHY コメント違反 |

承認後に分割実装します。
```
