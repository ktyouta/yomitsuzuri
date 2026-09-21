---
name: detect-recurring-feedback
description: |
  ユーザーから繰り返し指摘されるレビュー内容・修正内容・設計ルールを検出し、
  Claude Code Skill 化または既存 Skill 強化を提案するための Skill。

  以下のような場合に使用する：
  - 同じレビュー指摘が何度も発生している
  - 毎回同じ修正をしている
  - チーム独自ルールが定着してきた
  - Claude が毎回同じミスをする
  - Claude が同じミスをした直後
  - recurring pattern を Skill に昇格したい
  - Claude のレビュー精度を継続改善したい

  主なトリガーワード：
  - 「毎回同じ指摘してる」
  - 「 recurring feedback を検出して」
  - 「よくある指摘を分析」
  - 「Skill 化した方がいいルールある？」
  - 「繰り返しミスを抽出」
  - 「レビュー傾向を分析」
  - 「Claude が何度も同じミスをする」

  使用シーン：
  - レビュー品質改善
  - Skill 自動進化
  - チームルール抽出
  - Claude Code 運用改善
  - recurring pattern 分析
version: 1.0.0
---

# Detect Recurring Feedback

## Overview

ユーザーから繰り返し発生している：

- レビュー指摘
- 修正依頼
- コーディングルール
- 設計ルール
- 命名規則
- アンチパターン

を分析し、

- 新規 Skill 作成
- 既存 Skill 強化
- examples 追加
- Skill 分割

を提案する。

この Skill は、
Claude Code 環境を継続的に改善することを目的とする。

---

## Detection Targets

以下を recurring pattern として検出対象にする。

- 同じレビュー指摘
- 同じ修正依頼
- 同じ設計方針
- 同じ命名指摘
- 同じ lint 修正
- 同じ architecture 指摘
- 同じ anti-pattern

---

## Instructions

### 1. フィードバック履歴を分析する

以下を確認する：

- 同一指摘の頻度
- 類似指摘の頻度
- 修正パターン
- recurring anti-pattern
- recurring design rule

頻度が高いものを抽出する。

---

### 2. recurring pattern を分類する

検出した内容を分類する。

例：

| 分類 | 例 |
|---|---|
| React Hooks | useEffect dependency |
| Architecture | 責務分離 |
| Naming | boolean命名 |
| Testing | テスト不足 |
| Performance | 不要render |
| Security | null check不足 |

---

### 3. Skill の存在を確認する

対象ルールに対応する Skill が：

- 存在しない
- 既に存在する

を確認する。

---

### 4. Skill が存在しない場合

新規 Skill 作成を提案する。

例：

```txt
react-hooks-review
naming-review
null-safety-review
```

---

### 5. Skill が既に存在する場合

既存 Skill の強化を提案する。

改善例：

- examples 追加
- trigger word 強化
- Instructions 明確化
- recurring anti-pattern 追加
- Output Rules 強化

---

### 6. recurring pattern を Skill 化すべきか判定する

以下を満たす場合、
Skill 化を推奨する：

- 3回以上繰り返されている
- 毎回同じ説明が必要
- チーム共通ルール化できる
- Claude が継続的に誤る
- review 工数削減効果が高い

---

## Output Rules

以下形式で出力する：

```md
## Recurring Feedback Analysis

### 検出ルール
- useEffect dependency 指摘
- boolean 命名指摘

### 推奨アクション
- react-hooks-review 作成
- naming-review 強化

### 改善理由
- 同一指摘が複数回発生
- Claude が継続的に誤っている
```

---

## Constraints

禁止：

- 単発指摘の Skill 化
- 巨大 Skill 化
- 抽象的すぎる Skill 名
- examples 無し提案
- 責務過多 Skill

提案前に必ず自問する：

1. **クラスで捉えているか** — 今回の問題は一回限りか、それとも繰り返すパターン（クラス）か。クラスでなければ Skill 化しない。
2. **別の形で再発しないか** — 提案する修正が、表現を変えただけで同じ問題を再現させないか。根本にあるルールを Skill に書いているか。
3. **限界を正直に述べているか** — 「この修正で完全に解決する」と断言せず、すり抜けうる残存リスクを明示する。

---

## Best Practices

推奨：

- 小さい Skill
- recurring pattern 単位で分離
- examples 重視
- trigger word 強化
- review 指摘を継続学習
