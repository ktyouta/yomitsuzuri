---
name: improve-skills
description: |
  既存の Claude Code Skill を分析し、
  構造・説明・examples・再利用性・Claude理解性を改善するための Skill。

  以下のような場合に使用する：
  - Skill の精度を上げたい
  - Claude が Skill をうまく使えていない
  - Skill の description が弱い
  - trigger word を増やしたい
  - examples を追加したい
  - Skill を保守しやすくしたい
  - Skill の責務が大きすぎる

  主なトリガーワード：
  - 「Skill を改善して」
  - 「improve skill」
  - 「Skill を最適化」
  - 「Skill の精度を上げたい」
  - 「Skill をレビューして」
  - 「Skill をリファクタリング」
  - 「Skill を強化したい」

  使用シーン：
  - Skill 運用改善
  - Claude の応答精度改善
  - Skill リファクタリング
  - Few-shot 強化
  - Skill の長期保守
version: 1.0.0
---

# Improve Skill

## Overview

既存の Claude Code Skill を分析し、
Claude がより理解・再利用・実行しやすい構造へ改善する。

改善対象：

- description
- trigger word
- examples
- Instructions
- ディレクトリ構成
- 責務分離
- 再利用性
- Claude の判断しやすさ

を最適化する。

---

## Instructions

### 1. Skill 全体を分析する

以下を確認する：

- Skill の責務
- Skill の目的
- Claude が迷いやすい箇所
- 再利用性
- 構造の複雑さ
- examples の有無
- trigger word の不足

---

### 2. frontmatter を改善する

description を強化する。

必ず以下を含める：

- Skill の目的
- 使用シーン
- trigger word
- 実行タイミング

Bad:

```yaml
description: React review
```

Good:

```yaml
description: |
  React コンポーネントレビューを行う Skill。

  使用シーン：
  - PRレビュー
  - hooks確認
  - rendering最適化

  トリガーワード：
  - React review
  - コンポーネントレビュー
  - useEffect確認

  実行タイミング：
  - React コンポーネント実装後
  - PR作成前
```

---

### 3. examples/expected-output.md を必ず確認する

`examples/expected-output.md` が存在しない場合、**必ず新規作成する**（提案にとどめない）。

`expected-output.md` に含めるもの：
- 代表的な入力状況（ケース名 + 状況の説明）
- その状況での期待出力（SKILL.md の Output Format に完全に沿った形式）
- OK / NG の両パターンを最低1件ずつ

既に存在する場合は内容が SKILL.md の Output Format と一致しているか確認し、
ずれがあれば修正する。

Claude は説明文より
Few-shot examples を強く参照するため、
expected-output.md は Skill の精度を左右する最重要ファイルである。

---

### 4. Instructions を整理する

以下を確認する：

- 手順が曖昧ではないか
- Claude が実行順序を理解できるか
- 長文になりすぎていないか
- 箇条書き化できるか

必要なら：

- Steps
- Constraints
- Output Rules
- Anti Patterns

を追加する。

---

### 5. 責務分離を確認する

1 Skill に責務が多すぎる場合、
Skill 分割を提案する。

Bad:

```txt
fullstack-review
```

Good:

```txt
frontend-review
backend-review
security-review
```

---

### 6. trigger word を見直す

トリガーワードが「自然な言葉」になっているか確認する。

Bad（スキルの存在を知っていないと使えない言葉）:

```
「実装計画を立てて」「タスクに分解して」「展開漏れを確認して」
→ ユーザーがスキルを意識して呼び出す形になっている
```

Good（作業の文脈でスキルを意識せず自然に発する言葉）:

```
「〇〇機能を追加したい」「〇〇を実装したい」
→ 作業の話をしているだけでスキルが発火する
```

例外：Skill 管理・開発ツール系のメタスキルは操作自体が明示的なため、直接的なトリガーでよい。

```
create-skills / improve-skills → 「Skill を作って」「Skill を改善して」でよい
```

また、既存のトリガーに以下も追加する：

- 日本語・英語・類義語
- 実運用で実際に使いそうな言葉

強制発火させたいトリガーに「必ず」が入っているか確認する。

```
# 「必ず」あり（強制）→ borderline なケースでスキップされない
以下のような場合に必ず使用する：

# 「必ず」なし（任意）→ Claude が判断してスキップする可能性がある
以下のような場合に使用する：
```

入っていない場合は「以下のような場合に必ず使用する：」に修正する。

---

### 7. Claude が迷いやすい箇所を除去する

以下を減らす：

- 抽象表現
- 曖昧な指示
- 長すぎる説明
- 複数責務
- 不明瞭な出力形式

---

## Improvement Checklist

改善時は以下を確認する。

- frontmatter がある
- description が具体的
- trigger word がある（スキルを意識せず自然に発する言葉か）
- 強制発火が必要な箇所に「必ず」が使われているか
- examples がある
- 単一責務
- 手順が明確
- Claude が実行しやすい
- 出力形式が定義されている
- 曖昧表現が少ない

---

## Constraints

以下は禁止：

- JSON 化
- frontmatter 削除
- examples 削除
- 責務追加しすぎ
- 巨大 Skill 化
- 曖昧な改善提案のみ
- 実行不能な手順追加
- 行動規則（レビュー観点・設計指針・チェックルール）を memory に保存すること — 行動規則は skill に書く。memory はプロジェクト文脈・ユーザー好みなどの事実情報のみ
- CLAUDE.md・skills・agents の変更をユーザーの承認なしに実施すること — 変更内容を先に提示し、承認を得てから実施する
- 会話内で使った「変更1」「案B」「パターンB」などの内部番号・記号をそのまま使うこと — ユーザーや将来の自分はその番号の文脈を持っていないため、常にゼロベースで内容を説明し直す

---

## Output Rules

改善時は以下を出力する：

1. 問題点
2. 改善理由
3. 修正内容
4. 修正後サンプル
5. 必要なら分割提案

---

## Examples

### User Input

```txt
この Skill の精度を改善して
```

### Expected Output

```md
改善点:
- trigger word 不足
- examples 不足
- Instructions が曖昧

改善内容:
- examples/ を追加
- trigger word を追加
- 手順を番号化

推奨追加:
examples/
├── good-example.md
└── expected-output.md
```

---

## Best Practices

推奨：

- 小さい Skill
- examples 重視
- trigger word 強化
- 単一責務
- Claude が判断しやすい構造

---

## Anti Patterns

避ける：

- 巨大 Skill
- examples 無し
- description が短すぎる
- 「柔軟に対応する」だけの説明
- Claude の推測頼み
