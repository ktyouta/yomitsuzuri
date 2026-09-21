# Expected Output — Create Skills

---

## ケース1: レビュー系スキルの作成

### ユーザー入力

```
null チェック漏れを検出するレビュー Skill を作って
```

### 出力

```
以下の構成で作成します。承認後に実装します。

## ディレクトリ構成

.claude/skills/null-safety-review/
├── SKILL.md
└── examples/
    └── expected-output.md

## SKILL.md（内容）

---
name: null-safety-review
description: |
  コード変更が完了した直後に、null チェック漏れの観点でチェックを行う。

  以下のような場合に必ず呼び出す：
  - コードの新規作成・修正を行ったとき（フロントエンド・バックエンド問わず）

  以下の場合は使用しない：
  - 調査・説明・設計相談のみの場合
version: 1.0.0
---

# Null Safety Review Skill

## Overview

実装後に、null チェック漏れに関する違反パターンをチェックする。

## Check Instructions

### Null チェック漏れ
- 外部入力・API レスポンス・DB 結果を受け取る箇所で null / undefined チェックがあるか
- Optional チェーン `?.` や Nullish 合体演算子 `??` を使っているか
- null を返す可能性があるのに戻り値型が non-nullable になっていないか

## Output Format

違反がある場合：
## Null Safety Review 結果

### 違反あり
- **ファイル**: [ファイルパス:行番号]
- **違反内容**: 具体的な問題
- **修正方針**: null チェック追加または型修正

違反がない場合：
## Null Safety Review 結果

チェック完了。問題なし。

承認しますか？
```

---

## ケース2: ワークフロー系スキルの作成

### ユーザー入力

```
デプロイ前チェック Skill を作って
```

### 出力

```
以下の構成で作成します。承認後に実装します。

## ディレクトリ構成

.claude/skills/pre-deploy-check/
├── SKILL.md
└── examples/
    └── expected-output.md

## SKILL.md（内容）
... （略）

承認しますか？
```
