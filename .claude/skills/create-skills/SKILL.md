---
name: create-skills
description: |
  Claude Code Skills を正しい形式・構成で生成するためのスキル。

  以下のような場合に使用する：
  - 新しい Claude Code Skill を作成したい
  - Skill のフォーマットを統一したい
  - Skill 構成をベストプラクティスに沿わせたい
  - examples / templates / docs を含む再利用可能な Skill を作りたい

  主なトリガーワード：
  - 「Skill を作って」
  - 「create skill」
  - 「Claude Code Skill 作成」
  - 「レビュー用 Skill を作りたい」
  - 「コミットメッセージ生成 Skill を作りたい」
  - 「Skill の雛形を作成」
  - 「新しい Skill を追加」

  使用シーン：
  - Claude Code 開発環境の整備
  - チーム用 Skill 作成
  - 個人開発用 Skill 作成
  - Skill テンプレート生成
version: 1.0.0
---

# Create Skill

## Overview

Claude Code 用の Skill を、
最新の推奨構成・統一フォーマットで生成する。

このスキルは：

- Skill フォーマット統一
- 不正構成防止
- Claude が理解しやすい構造化
- 再利用可能な Skill 設計
- examples を活用した Few-shot 最適化

を目的とする。

---

## Required Directory Structure

必ず以下の構成を基本とする。

```txt
.claude/
└── skills/
    └── <skill-name>/                   # Skillごとの専用ディレクトリ
        │                               # 1 Skill = 1 フォルダで管理する
        │
        ├── SKILL.md                    # Skill本体（必須）
        │                               # Claudeへの指示書
        │                               # Purpose / Instructions / Examples を定義
        │
        ├── templates/                  # テンプレート置き場（任意）
        │                               # README・Issue・PRテンプレなど
        │
        ├── examples/                   # Few-shot用の出力例（重要）
        │                               # 良い例・悪い例・期待出力を置く
        │
        └── scripts/                    # 補助スクリプト置き場（任意）
                                        # shell/python/node等の自動処理
```

---

## Instructions

### 1. Skill の目的を明確化する

最初に以下を定義する：

- この Skill は何をするか
- どんな時に使うか
- どんな入力を受けるか
- どんな出力を返すか

---

### 2. frontmatter を生成する

必ず以下を含める：

```yaml
name:
description:
version:
```

description には：

- Skill の目的
- 使用シーン
- trigger word

を含める。

---

### 3. SKILL.md を生成する

必ず以下の構造を含める：

```md
# Skill Name

## Overview

## Instructions

## Examples
```

---

### 4. examples/expected-output.md を必ず作成する

Skill を新規作成するときは、**必ず** `examples/expected-output.md` を作成する。

```txt
examples/
└── expected-output.md   ← 必須
```

`expected-output.md` には以下を含める：
- 代表的な入力状況（ケース名 + 状況の説明）
- その状況での期待出力（SKILL.md の Output Format に完全に沿った形式）
- OK / NG の両パターンを最低1件ずつ

Claude は説明文より Few-shot examples を強く参照するため、
expected-output.md は Skill の精度を左右する最重要ファイルである。
省略・後回しは禁止する。

---

### 5. トリガーの種類を最初に決める

Skill を作る前に、以下の3種類のどれに該当するかを判断する。
種類によってトリガーの書き方が異なる。

---

#### ① 自律トリガー（Claude が自動実行）

ユーザーのトリガーワードは不要。
「以下のような場合に使用する」に「Claude 自身が〇〇を完了した直後」と書く。

```
# 例：実装後レビュー系
以下のような場合に使用する：
- 自分（Claude）が実装・コード修正を完了した直後
```

該当するスキル例：frontend-review / backend-review / comments-review / architecture-review

---

#### 共通：強制発火させる場合は「必ず」を入れる

トリガー種別によらず、Claude に確実に発火させたい場合は
「以下のような場合に**必ず**使用する：」と明記する。

```
# 「必ず」あり（強制）
以下のような場合に必ず使用する：
- ...

# 「必ず」なし（任意）
以下のような場合に使用する：
- ...
```

「必ず」がないと、Claude が borderline なケースでスキップする可能性がある。
強制発火が意図であれば必ず入れること。

---

#### ② ユーザートリガー（ユーザーの言葉で発火）

「ユーザーがスキルを意識せずに自然に発する言葉」をトリガーにする。
プロセスの名前を呼ぶ言葉は書かない。

Bad（スキルの存在を知っていないと使えない言葉）:

```
「実装計画を立てて」「タスクに分解して」「展開漏れを確認して」
```

Good（作業の文脈で自然に出てくる言葉）:

```
「〇〇機能を追加したい」「〇〇を実装したい」「〇〇はどう設計すればいい？」
```

---

#### ③ メタスキル（Skill 管理ツール）

操作自体が明示的なため、直接的なトリガーでよい。

```
create-skills  → 「Skill を作って」でよい
improve-skills → 「Skill を改善して」でよい
```

---

### 6. 単一責務を守る

1 Skill に複数責務を持たせすぎない。

Bad:

```txt
fullstack-everything-skill
```

Good:

```txt
frontend-review
backend-review
commit-message
```

---

## Constraints

禁止：

- frontmatter の省略
- examples 無し巨大 Skill
- 曖昧な description
- 複数責務 Skill
- 存在しない Claude Code 機能の記述
- CLAUDE.md・skills・agents の変更をユーザーの承認なしに実施すること — 変更内容を先に提示し、承認を得てから実施する
- スキルの存在確認を Glob の結果だけで判断すること — Glob はパス区切り・大文字小文字の違いで検出漏れが発生するため、Glob で見つからない場合でも Test-Path または Read で二重確認すること

---

## Output Rules

必ず以下を出力する：

1. ディレクトリ構成
2. SKILL.md
3. examples（必要なら）
4. templates（必要なら）

---

## Examples

### User Input

```txt
React レビュー用 Skill を作って
```

### Expected Output

```txt
.claude/skills/react-review/
└── SKILL.md
```
