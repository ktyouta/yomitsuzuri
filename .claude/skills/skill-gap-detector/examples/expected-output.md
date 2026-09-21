# Expected Output — Skill Gap Detector

---

## ケース1: 分類 A（漏れ）

### 状況
- backend-review で NG → マイグレーションファイルの `index.ts` バレルエクスポートがなかったが、backend-review のチェックリストに記載がない

### 出力

```
## Skill Gap 検出結果

### NG 内容
- backend/src/infrastructure/user/repository/ に `index.ts` が存在しない

### 原因分類
- 分類: A（漏れ）
- 該当 skill: `backend-review`

### 修正提案（A・B の場合）
`backend-review` の「フォルダ・ファイル構成」セクションに以下を追記することを提案します：

```
- 各レイヤーフォルダに `index.ts` バレルエクスポートが存在するか
```

承認しますか？
```

---

## ケース2: 分類 B（記述が弱い）

### 状況
- frontend-review で NG → `text-sm` のボタン使用が通過してしまった。チェック項目に記載はあるが「意図的に目立たせない副次的アクションのみ」という条件が曖昧で判定できなかった

### 出力

```
## Skill Gap 検出結果

### NG 内容
- action-buttons.tsx のメインボタンに `text-sm` が使われていたが frontend-review で検出されなかった

### 原因分類
- 分類: B（記述が弱い）
- 該当 skill: `frontend-review`

### 修正提案（A・B の場合）
`frontend-review` の「テキストサイズ」チェック項目を以下に強化することを提案します：

```
- `text-sm` を使っているボタン・ラベルが存在する場合、それが「やり直す」「キャンセル」等の副次的アクションか確認する
  - 主要アクション（送信・選択・確認）に `text-sm` を使っていれば違反
```

承認しますか？
```

---

## ケース3: 分類 C（skill の問題ではない）

### 状況
- spec-review で仕様との差分を検出 → 割引計算のビジネスルールを実装者が誤解していた

### 出力

```
## Skill Gap 検出結果

### NG 内容
- 割引率が仕様（10%）と実装（5%）で異なる

### 原因分類
- 分類: C（skill の問題ではない）
- 理由: spec-review は仕様と実装の差分を正しく検出している。今回は実装者の誤解であり、skill のチェック項目に問題はない

→ skill の修正は不要です。
```
