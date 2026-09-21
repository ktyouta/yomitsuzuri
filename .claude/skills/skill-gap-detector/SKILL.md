---
name: skill-gap-detector
description: |
  レビューまたは仕様突き合わせで NG が検出されたとき、
  既存 skill のチェック項目の漏れを特定し、修正案を提案する。

  以下のような場合に使用する：
  - backend-review / resource-authz-review / frontend-review / architecture-review / rpc-review / db-naming-review / spec-review でNG が出たとき（feature-impl 経由・手動実行どちらも対象）
  - feature-impl の Step 11 として自動実行されるとき
  - ユーザーから「仕様と違う」「想定の実装になっていない」「ファイル・メソッドの分け方がおかしい」などの指摘があったとき

  主なトリガーワード：
  - 「この NG を次回から防ぎたい」
  - 「レビュー結果を skill に反映して」
  - 「なぜ検出できなかったか分析して」
  - 「同じミスが起きないようにして」
  - 「これ仕様と違う」
  - 「この実装は意図した形になっていない」
  - 「ファイルの分け方がおかしい」
  - 「このメソッドはサービスに置くべき」
  - 「想定と違う作りになっている」
  - 「skill の漏れを確認して」

  以下の場合は使用しない：
  - NG もユーザー指摘もない場合
  - 調査・説明のみの場合

  detect-recurring-feedback との違い：
  - detect-recurring-feedback：過去の会話の蓄積からパターンを検出する
  - skill-gap-detector：今回の実装サイクルの NG またはユーザー指摘を即時に分析する
version: 1.0.0
---

# Skill Gap Detector

## Overview

レビューや仕様突き合わせで検出された NG を受け取り、
その原因が既存 skill のチェック漏れにあるかを特定する。
修正案を提示し、人間の承認を得てから skill に反映する。

---

## Procedure

1. NG の内容（レビュー違反・仕様差分）を受け取る
2. 関連する既存 skill の Check Instructions を Read で読み込む
3. NG の原因を以下のいずれかに分類する
   - A: 既存 skill に記載がない（漏れ）
   - B: 既存 skill に記載はあるが検出できなかった（記述が弱い）
   - C: skill の問題ではない（実装判断の誤り）
4. A・B の場合のみ修正案を提示する
5. ユーザーの承認を得てから skill を修正する

---

## Output Format

```
## Skill Gap 検出結果

### NG 内容
- ...

### 原因分類
- 分類: A（漏れ）/ B（記述が弱い）/ C（skill の問題ではない）
- 該当 skill: [skill 名]

### 修正提案（A・B の場合）
[skill 名] に以下を追記することを提案します：

[追記内容]

承認しますか？
```

---

## Constraints

- skill の修正はユーザーの承認を得てから行う（自律書き換え禁止）
- 分類 C の場合は skill 修正を提案しない
- 1回の実行で複数の NG がある場合は、skill ごとにまとめて提案する
- 既存 skill の内容は必ず Read で確認してから判断する
