---
name: feature-impl
description: |
  新機能の実装を設計から完了まで一貫して進める。

  以下のような場合に使用する：
  - 「〇〇機能を実装したい」
  - 「〇〇を作りたい」
  - 「〇〇を追加して」

  以下の場合は使用しない：
  - バグ修正（horizontal-scope を使う）
  - 調査・説明のみの場合
version: 2.0.0
---

# Feature Implementation Skill

## Overview

新機能の実装を、設計 → 確認 → 実装 → レビュー → 仕様突き合わせ の順で一貫して進める。
途中2回ユーザー確認を挟み、誤った方向に進まないようにする。

---

## Steps

### Step 0: plan.md の確認

実装を開始する前に `docs/` 配下に対象機能の `plan.md` が存在するか確認する。

- 存在する場合: feature-resume を実行し、再開ポイントを特定してから当該ステップへジャンプする
- 存在しない場合: Step 1 から通常通り進める

---

### Step 1: 設計分解

新規テーブル・新規APIエンドポイントを伴うなど、データモデル・API契約の設計判断が必要な機能の場合は、feature-breakdown の前に design-architect を実行して基本設計案（複数案+推奨案）を確定させる。単純な機能追加で設計判断が不要な場合はスキップしてよい。

feature-breakdown を実行し、機能をバックエンド・フロントエンドのタスクに分解する。

---

### Step 2: 設計書を出力

分解した設計を `docs/[機能名]/plan.md` に出力する。
既存ファイルがある場合は上書きせず、ユーザーに確認する。

---

### Step 3: ユーザー確認（設計・ファイル構成）

impl-planner を実行し、設計内容・作成ファイル一覧・フォルダ構成チェックをまとめてユーザーに提示する。

```
## 設計確認

### バックエンド
- エンドポイント: ...
- Usecase メソッド: ...
- Repository メソッド: ...

### フロントエンド
- コンポーネント: ...
- hooks: ...

### 作成・変更ファイル一覧

| ファイルパス | レイヤー | 操作 |
|---|---|---|
| backend/src/presentation/xxx/controller/get-xxx/get-xxx.controller.ts | Controller (Presentation) | 新規 |
| backend/src/application/xxx/usecase/get-xxx/get-xxx.usecase.ts | Usecase (Application) | 新規 |
| backend/src/domain/xxx/repository/get-xxx/get-xxx.repository.interface.ts | Repository interface (Domain) | 新規 |
| backend/src/infrastructure/xxx/repository/get-xxx/get-xxx.repository.ts | Repository実装 (Infrastructure) | 新規 |
| frontend/src/features/xxx/api/get-xxx.ts | API | 新規 |
| ... | ... | ... |

新規ユーティリティファイル・共有ファイルを作成する場合は、以下も明示する：

| ファイルパス | 責務 | export するもの |
|---|---|---|
| ... | ... | ... |

### 仕様要件チェック（docs/[機能名]/spec.md 準拠）
docs/[機能名]/spec.md が存在する場合のみ実施する。

- spec.md から要件項目を抽出したか
- 全ての要件項目が設計（エンドポイント・Service・Repository・コンポーネント）に反映されているか

### フォルダ構成チェック（CLAUDE.md 準拠）
- エンドポイント単位のファイル分割になっているか
- バックエンドのファイルが1単位1フォルダ（`<名前>/<名前>.<種別>.ts` + `index.ts`）になっているか
- `domain/{機能}/`（entity, value-object, repository interface）、`application/{機能}/`（usecase, dto）、`infrastructure/{機能}/repository/`、`presentation/{機能}/`（controller, schema）の4層構成に沿っているか
- repository に .interface.ts が `domain/` 側にセットで存在するか
- Container に -container.tsx サフィックスがついているか
- api/ に query-key.ts が含まれているか
- components/ 配下がフラットになっているか（サブフォルダを作っていないか）

### クラス仕様（契約）
バックエンドの変更がある場合のみ記載する。新規・変更するドメイン層（Entity・Value Object）・`util/`・Usecase について、design-architect の契約表形式で記載する。

#### [クラス名・関数名]（[レイヤー]）
- **不変条件**: ...
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|

- **テストケース**: ...

### バックエンド設計チェック（CLAUDE.md 準拠）
バックエンドの変更がある場合のみ実施する。

- 新規・変更するドメイン層・`util/`・Usecase の契約（クラス仕様）を定義したか
- ドメイン層・`util/` に副作用（外部状態の書き換え・I/O・ログ出力）がないか。決定的でない処理（時刻・乱数・ID 生成）は名前付きファクトリメソッドに閉じ込めているか
- Usecase の事後条件を、業務上意味のある分岐に限定しているか（Repository の呼び出し順などを契約にしていないか）

- Usecase は1エンドポイントにつき public メソッド `execute` 1つで、処理の流れと業務上の分岐を Usecase 内で完結させているか（Controller に処理の順序を組み立てさせていないか）
- 純粋なビジネスロジック（検証・計算）をドメイン層・`util/` に置き、Usecase は I/O と処理の流れの制御に徹しているか
- Controller が Repository・Drizzle に直接触れていないか（Presentation層はUsecase呼び出しのみ）
- 複数テーブル・複数モジュールへのアトミックな書き込みが必要な場合、1つの Repository メソッドに集約し `db.batch` を Infrastructure層内で完結させる設計になっているか（Usecase/Controller に Drizzle の書き込みAPIを持たせない）
- 実装に必要な全 ID 型・値型に対応するドメイン型が `domain/` に存在するか確認したか
- 存在しない場合、新規ドメイン型の作成をタスクに含めているか（既存型の流用で代替していないか）
- join テーブルの PK が新規採番すべきか、既存の関連 ID を流用すべきか検討されているか
- 新しい Usecase が自モジュール以外の `domain/{他モジュール}/repository` interface に依存する場合、その越境が正当か（単なるモジュール分割漏れでないか）確認したか

問題がなければ実装に進みます。よろしいですか？
```

ユーザーの OK を得てから次へ進む。

OK を得たら、承認されたクラス仕様（契約）を `docs/[機能名]/plan.md` の末尾に「## クラス仕様（契約）」節として追記する（spec-review が契約とテストの突き合わせに使うため）。バックエンドの変更がない場合は追記しない。

---

### Step 4: バックエンド実装

Step 3 の実装計画に沿ってバックエンドを実装する。

#### 【必須・ブロッキング】契約テストを先に書く（テスト駆動）

ドメイン層・`util/`・Usecase は、Step 3 で定めた契約の各項目に対応するテストを**実装より先に**書く。以下の順で進める。

1. Repository interface と、ドメイン層・`util/` のクラス・関数の型（シグネチャのみ。中身は未実装）を作る
2. ドメイン層・`util/` の契約テストを書き、`npm run test --prefix backend -- --run` で**失敗することを確認する**
3. ドメイン層・`util/` を実装し、2 のテストを通す
4. Usecase の契約テストを書き、**失敗することを確認する**
5. Usecase を実装し、4 のテストを通す
6. Repository 実装・Controller 等の残りを実装する

テストの書き方：
- バックエンドのテストファイルは実装ファイルと同じ単位フォルダに配置する（例: `src/domain/book/value-object/book-id/book-id.test.ts`）
- ドメイン層・`util/`：値を渡し、戻り値・保持する値・例外を確認する
- Usecase：Repository interface を満たすスタブ（オブジェクトリテラル + `vi.fn()`）を渡し、DB を使わずに戻り値と、業務上意味のある書き込みが行われた／行われなかったことを確認する
- 決定的でない値（ID・時刻）は具体値ではなく、存在・形式を確認する
- workerd の起動失敗（`ConnectEx` 等）で `no tests` になった場合は、テストの失敗・通過のどちらとしても扱わない（環境要因として報告する）

**失敗を確認していないテストで実装に進まない。契約の全項目にテストがあり、全件通過するまで Step 5 に進んではならない。**

実装時に以下を必ず守る：

- `Map.get()` / `c.get()` 等の返り値に non-null アサーション（`!`）を使わない
  - `Map.get(key)` の結果には `?? defaultValue` または `if (!v) { continue; }` で対処する
  - `c.get("ctx")` の結果には early return ガード節（`if (!ctx) { return c.json(...); }`）を置く

#### 【必須・ブロッキング】schema.ts を変更した場合の DBマイグレーション

`schema.ts` に変更を加えた場合、コード実装を完了した後に以下を**必ずこの順で**実行する：

1. `npm run db:generate` を実行する
2. 生成された `drizzle/*.sql` と `drizzle/meta/` の内容が期待通りか確認する
3. 確認できたら Step 5 に進む

**このステップを完了しない限り Step 5 に進んではならない。**

以下は**絶対禁止**：
- `drizzle/*.sql` を手動で新規作成・編集すること（`db:generate` の代替にはならない）
- `db:generate` の実行をスキップして「SQL 手書きで済ませる」こと
- `_journal.json` や `drizzle/meta/` スナップショットを手動で編集すること

`db:generate` が対応できない変更（SQLite の制約上 ALTER TABLE で対応できない操作等）は `db:generate --custom` で空ファイルを生成してから SQL を記述する（直接ファイルを作成しない）。

#### 【型チェック】実装完了後に型エラーがないか確認する

ルートで `npm run typecheck` と `npm run lint` を実行し、エラーが 0 件になってから次の Step に進む。

---

### Step 5: backend-review 実行

backend-review を実行する。あわせて resource-authz-review を実行する。

---

### Step 6: ユーザー確認（バックエンド）

以下の形式で出力し、ユーザーの確認を得る。

```
## バックエンド実装完了

### 変更ファイル
- [ファイルパス]: 追加・変更の概要

### 実装内容サマリー
- エンドポイント: ...
- Usecase メソッド: ...
- Repository メソッド: ...

### 契約テスト結果
- 契約項目: [n] 件 / 対応するテスト: [n] 件
- 実装前の失敗確認: 済み（[n] 件失敗を確認）
- 実行結果: [n] 件中 [n] 件通過

### backend-review 結果
- 問題なし / 違反あり（詳細）

### resource-authz-review 結果
- 問題なし / 違反あり（詳細）

確認できたら実装を続けます。よろしいですか？
```

ユーザーの OK を得てから次へ進む。

**注意**: この時点では plan.md の更新を行わない。spec-review（Step 9）通過後の Step 10 で実施する。

---

### Step 7: フロントエンド実装

Step 3 の実装計画に沿ってフロントエンドを実装する。

実装に入る前に以下を必ず行う：

**7-a. 実装前に対象画面の関連ファイルをすべて Read する**
- 対象画面のコンポーネント・ページファイルだけでなく、レイアウト・親コンテナも含む全ファイルを確認する
- 実装前に `src/components/` を Glob し、ボタン・入力フィールド等の利用可能な共通コンポーネントを把握してから実装に入る
- 「雰囲気だけ把握した」ではなく「全ファイルを読んだ」状態で実装に入る
- クリッカブルカードなどのインタラクティブ要素を実装する場合、HTML 要素の選択（`div` vs `button` 等）も既存コンポーネントを Read して踏襲する

**7-b. UI を伴う場合、実装前に「何をどう見せるか」を1文で定義する**
- 例: 「登録フォームをモーダルとして中央に表示する」
- この1文が定まってからコードを書く。曖昧なまま書き始めない

**7-c. 実装完了後に型エラーがないか確認する**

ルートで `npm run typecheck` と `npm run lint` を実行し、エラーが 0 件になってから Step 8 に進む。

---

### Step 8: レビュー実行

以下のレビューを実行する：

- frontend-review
- architecture-review
- comments-review
- performance-check（以下の**全てに**該当しない場合のみスキップ可。迷ったら実行する）
  - Service にループ内 DB アクセスがない
  - `useQueries` / `useEffect` の依存配列が小規模
  - `map` / `filter` / `sort` の多段処理がない
- rpc-review（以下のいずれかに該当する場合は必須）
  - `frontend/src/features/**/api/use-*.ts` に新規ファイルを追加した
  - `rpc.api.v1.` を含む import を追加・変更した
- DB スキーマを変更した場合: db-naming-review

**NG が検出された場合**: 各レビュー内で NG を修正し、Step 8 の末尾に以下を記録する：
```
NG 累計: [n] 件 → Step 11 で skill-gap-detector を必ず実行すること
```
NG が 0 件の場合は何も記録しない。

---

### Step 9: 仕様突き合わせ

spec-review を実行する。

---

### Step 10: plan.md 更新

> **実行前確認**（`[x]` に変更する前に以下を満たすこと）:
> - Step 8 で NG が検出されていた場合、修正が完了しているか
> - Step 9 spec-review の「未実装」「仕様と異なる実装」が 0 件か
>
> 未達の項目がある場合は `[x?]`（仮マーク）にとどめ、解消後に `[x]` に変更する。

`docs/[機能名]/plan.md` を Read し、今回実装したタスクに対応する行を特定して更新する。

- 実装完了したタスクの `[ ]` を `[x]` に変更する
- 設計議論を経て実装内容が当初の計画から変わった場合は、タスク説明も実態に合わせて修正する
- plan.md が存在しない場合はスキップする

---

### Step 11: NG 対応

Step 5（backend-review / resource-authz-review）・8・9 でいずれかの NG があった場合、NG を修正した後であっても skill-gap-detector を実行し、
既存 skill の検出漏れを特定して修正提案を行う。

NG がゼロ件だった場合はスキップしてよい。

---

### Step 12: session-retrospective 実行

> **実行前チェックゲート**: Step 5・8・9 でいずれかの NG があった場合、`skill-gap-detector` を実行済みか確認する。未実行の場合は Step 11 に戻ってから進む。

全ステップ完了後に session-retrospective を実行する。

---

## Constraints

- 各 Step は順番通りに実行する（並行実行しない）
- ユーザー確認（Step 3・6）では必ずユーザーの明示的な OK を得てから次に進む
- Step 10 の plan.md 更新は spec-review 通過後に行う（NG 残存状態で `[x]` にしない）
- エラーや NG を無視して次のステップに進まない
- 契約テストは実装より先に書き、失敗を確認してから実装に進む（実装の後にテストを書かない）
- 契約（クラス仕様）の各項目に対応するテストがない状態、またはテストが通過していない状態で backend-review に進まない
- 指示にない機能を実装に追加しない
- ユーザーが明示的に承認していない前提・技術方針を「合意済み」として plan.md や後続スキルへの指示に記載しない。対象範囲・要件が変更された場合、変更前の前提は再検証してから引き継ぐ
- schema.ts を変更した場合は必ず `db:generate` を実行する。`drizzle/*.sql` を手動作成しない
- コーディング規約・チェック項目の追加は skill ファイルにのみ行う。skill で対応できる内容を CLAUDE.md に追記しない
