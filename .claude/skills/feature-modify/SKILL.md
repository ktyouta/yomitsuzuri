---
name: feature-modify
description: |
  既存機能の改修を設計から完了まで一貫して進める。

  以下のような場合に使用する：
  - 「〇〇を改修したい」
  - 「〇〇の仕様を変えたい」
  - 「〇〇に機能を追加したい（既存機能への追加）」
  - 「〇〇の動きを変えたい」
  - 「〇〇を変更して」

  以下の場合は使用しない：
  - バグ修正（→ bug-fix を使う）
  - リファクタリング（振る舞いを変えない変更 → refactor を使う）
  - 全く新しい機能の追加（既存コードへの依存がない場合 → feature-impl を使う）
version: 2.1.0
---

# Feature Modify Skill

## Overview

既存機能の改修を、現状把握 → 影響範囲調査 → 差分設計 → 確認 → 実装 → レビュー → 仕様突き合わせ の順で一貫して進める。

feature-impl との違い：
- 既存コードを読んでから設計する（グリーンフィールドではない）
- horizontal-scope で影響ファイルを洗い出す
- 設計は「差分設計」（何が変わるか）を中心にする

---

## Steps

### Step 0: UI 変更の場合は ui-consistency-review を先に実行する

改修がフロントエンドの UI（コンポーネント・レイアウト・スタイル）を含む場合、Step 1 に進む前に ui-consistency-review を実行する。

以下をすべて含む（既存コンポーネントへの要素追加・削除もここに含まれる）：
- 新規コンポーネントの追加
- 既存コンポーネントへのボタン・入力・セクション等の追加・削除
- レイアウト・スタイルの変更

ui-consistency-review の結果を踏まえた上で、Step 1 の設計・実装に入る。

UI 変更を含まない場合はこの Step をスキップする。

---

### Step 1: 改修内容の把握

以下を確認する：

- 何を変えるか（変更前の動作・変更後の期待動作）
- なぜ変えるか（仕様変更・要望・問題解決）
- バックエンド / フロントエンド / 両方のどこに影響するか

---

### Step 2: 既存実装の確認

以下を読んで現状を把握する：

- `docs/[機能名]/plan.md`（設計書が存在する場合）
- 改修対象の既存コード（controller(Presentation) / usecase(Application) / repository・entity・VO(Domain/Infrastructure) / component / hooks）

**バグ修正を含む改修の場合は追加で以下を行う：**
- 問題が発生しているイベントフロー・データフロー・呼び出し経路を図示またはコメントで明示する
- 「どこで何が起きているか」を経路単位で追跡してから修正方針を決める
- 修正前に「この修正で経路上のどこが変わるか」を確認する
  - 曖昧なまま修正すると「直っていない」が複数サイクル発生する原因になる

---

### Step 3: horizontal-scope で影響範囲を洗い出す【必須・ブロッキング】

horizontal-scope を実行し、今回の変更パターンと同じ対応が必要なファイルを特定する。

**このステップを実行しない限り Step 4 に進んではならない。** Step 4 の差分設計テンプレートは「horizontal-scope 実行結果」を記載する欄を含んでおり、この欄は horizontal-scope を実際に実行しないと埋められない（「対応不要と判断したためスキップ」は理由にならない。対応不要という判断自体を horizontal-scope の実行結果として記載する）。

---

### Step 4: 差分設計を出力

変更前・変更後の差分を中心に設計をまとめる。

```
## 差分設計

### horizontal-scope 実行結果
- 対象ファイル: [一覧を列挙。他に対応が必要なファイルがない場合も「horizontal-scope 実行済み、追加対象なし」と明記する]

### 変更内容
- [変更前]: ...
- [変更後]: ...

### バックエンド変更点
- エンドポイント: ...
- Usecase メソッド: ...
- Repository メソッド: ...

### フロントエンド変更点
- コンポーネント: ...
- hooks: ...

### 変更・影響ファイル一覧

| ファイルパス | レイヤー | 操作 |
|---|---|---|
| ... | ... | 変更 / 新規 / 削除 |

### 仕様要件チェック（docs/[機能名]/spec.md 準拠）
docs/[機能名]/spec.md が存在する場合のみ実施する。

- spec.md から要件項目を抽出したか
- 全ての要件項目が差分設計（エンドポイント・Usecase・Repository・コンポーネント）に反映されているか

### フォルダ構成チェック（CLAUDE.md 準拠）
- エンドポイント単位のファイル分割になっているか
- `domain/{機能}/`（entity, value-object, repository interface）、`application/{機能}/usecase/`、`infrastructure/{機能}/repository/`、`presentation/{機能}/`（controller, dto, schema）の4層構成に沿っているか
- repository に .interface.ts が `domain/` 側にセットで存在するか
- Container に -container.tsx サフィックスがついているか
- api/ に query-key.ts が含まれているか

### バックエンド設計チェック（CLAUDE.md 準拠）
バックエンドの変更がある場合のみ実施する。

- Usecase メソッドが 1操作1メソッドになっているか（複数の DB アクセス・分岐・計算を1メソッドに詰め込んでいないか）
- Controller の呼び出し順序でフローが読めるか（usecase メソッド名を上から読むだけで処理の流れが分かるか）
- Controller が単一の `usecase.xxx()` 呼び出しで完結していないか
- Controller が Repository・Drizzle に直接触れていないか
- ロジックを含まない処理（単純な構築・変換）が Usecase に混入していないか
- 複数テーブル・複数モジュールへのアトミックな書き込みが必要な場合、1つの Repository メソッドに集約し `db.batch` を Infrastructure層内で完結させているか

問題がなければ実装に進みます。よろしいですか？
```

ユーザーの OK を得てから次へ進む。

---

### Step 5: バックエンド変更実装

Step 4 の差分設計に沿ってバックエンドを変更する。

- `schema.ts` を変更した場合は `npm run db:generate` を実行し、生成された `drizzle/*.sql` と `drizzle/meta/` の変更をセットで扱う
- `drizzle/*.sql` を手動で新規作成・編集してはならない（`db:generate` が対応できない変更は `db:generate --custom` を使う）
- `schema.ts` を変更した場合、`db:generate` の後に必ず `npm run db:migrate:local` を実行してローカル D1 に反映する。`db:generate` はマイグレーションファイルの生成のみで DB 状態には反映されないため、適用を怠るとユーザーが実際に画面を開くまで SQL エラーが検出されない

---

### Step 6: backend-review 実行

backend-review を実行する。あわせて resource-authz-review を実行する。

---

### Step 7: ユーザー確認（バックエンド）

**Step 8（フロントエンド実装）に進む前に必ず実施する。** DBマイグレーション適用（`db:generate`/`db:migrate:local`）の実行可否確認など、Step 5 の実装作業に付随する別の確認とは別物であり、それらの確認に紛れて省略してはならない。

以下の形式で出力し、ユーザーの確認を得る。

```
## バックエンド変更完了

### 変更ファイル
- [ファイルパス]: 変更の概要

### 実装内容サマリー
- エンドポイント: ...
- Usecase メソッド: ...
- Repository メソッド: ...

### backend-review 結果
- 問題なし / 違反あり（詳細）

### resource-authz-review 結果
- 問題なし / 違反あり（詳細）

確認できたら実装を続けます。よろしいですか？
```

ユーザーの OK を得てから次へ進む。

---

### Step 8: フロントエンド変更実装

Step 4 の差分設計に沿ってフロントエンドを変更する。

変更に入る前に以下を必ず行う：

**8-a. Step 0 未実施チェック**

以下のいずれかに該当する場合は「UI 変更あり」と判定する：
- `<div>` / `<p>` / `<button>` / `<span>` 等の HTML 要素の追加・削除
- `className` のスタイルクラス変更（`items-*` / `gap-*` / `rounded-*` / `flex` 等）
- コンポーネントの追加・削除・入れ替え

「UI 変更あり」かつ Step 0 が未実施の場合、ui-consistency-review を今すぐ実行してから実装に進む。
バックエンド主体の改修でも差分設計後に JSX 変更が判明した場合はこのチェックが機能する。

**8-b. 対象画面の関連ファイルをすべて Read する**
- 対象画面のコンポーネント・ページファイルだけでなく、レイアウト・親コンテナも含む全ファイルを確認する
- 「雰囲気だけ把握した」ではなく「全ファイルを読んだ」状態で変更に入る
- クリッカブルカードなどのインタラクティブ要素を変更する場合、HTML 要素の選択（`div` vs `button` 等）も既存コンポーネントを Read して踏襲する

---

### Step 9: レビュー実行

以下を**全件実行**してから次へ進む（1つでも未実行の場合は Step を完了としない）：

- [ ] frontend-review
- [ ] architecture-review
- [ ] comments-review
- [ ] performance-check
- [ ] rpc-review（API 呼び出しを追加・変更した場合）
- [ ] db-naming-review（DB スキーマを変更した場合）

---

### Step 10: 仕様突き合わせ

`docs/[機能名]/spec.md` が存在する場合のみ spec-review を実行する。存在しない場合はスキップする（Step 4 の仕様要件チェックと同じ判定基準）。

---

### Step 11: NG 対応

Step 6（backend-review / resource-authz-review）・9・10 でいずれかの NG があった場合、skill-gap-detector を実行し、
既存 skill の漏れを特定して修正提案を行う。

---

### Step 12: session-retrospective 実行

全ステップ完了後に session-retrospective を実行する。

---

## Constraints

- 各 Step は順番通りに実行する（並行実行しない）
- Step 3（horizontal-scope）は省略しない。Step 4 の差分設計に「horizontal-scope 実行結果」欄を必ず含める（対応不要と判断した場合もその旨を明記する。無言でスキップしない）
- ユーザー確認（Step 4・7）では必ずユーザーの明示的な OK を得てから次に進む。Step 7 はマイグレーション適用可否など他の確認作業と混同して省略しない
- 既存テストが存在する場合は、変更後も通過するか確認する
- 指示にない機能を変更に追加しない
- エラーや NG を無視して次のステップに進まない
- schema.ts を変更した場合は必ず `db:generate` を実行する。`drizzle/*.sql` を手動作成しない
- schema.ts を変更した場合は `db:generate` に加えて必ず `db:migrate:local` を実行し、ローカル D1 に反映する
- コーディング規約・チェック項目の追加は skill ファイルにのみ行う。skill で対応できる内容を CLAUDE.md に追記しない
