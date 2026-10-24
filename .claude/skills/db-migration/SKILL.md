---
name: db-migration
description: |
  DB マイグレーションの生成・確認・検証・適用・報告を、データを失わない手順で進める。
  とくに SQLite のテーブル作り直し（DROP TABLE）で、子孫テーブルの行が ON DELETE CASCADE で消える事故を防ぐ。

  以下のような場合に必ず使用する：
  - 自分（Claude）が `backend/src/infrastructure/db/schema/schema.ts` を変更した直後（依頼文に「マイグレーション」という言葉がなくても使う）
  - `npm run db:generate` を実行するとき
  - マイグレーションを適用するとき（「マイグレーション適用して」「ローカルに反映して」「本番に反映したい」）
  - `db:check:*`・`db:migrate:*` の pre スクリプト、または hook でマイグレーションが止められたとき
  - 「列を NOT NULL にしたい」「列を削除したい」「テーブルを作り直したい」など、テーブルの作り直しが必要になりそうなとき

  以下の場合は使用しない：
  - テーブル名・共通カラムの命名の確認だけ（→ db-naming-review を使う）
  - シードデータの投入・削除（→ demo-seed を使う）
version: 1.0.0
---

# DB Migration Skill

## Overview

マイグレーションを「生成 → SQL の確認 → 必要なら書き換え → 使い捨て D1 での検証 → 適用 → 報告」の順で進める。

前提となる事実：

- D1 のマイグレーションはトランザクション内で実行されるため、drizzle-kit が生成する `PRAGMA foreign_keys=OFF` は効かない
- そのため親テーブルを DROP すると、参照している子孫テーブルの行が ON DELETE CASCADE で全件削除される（同じ構成の別プロジェクトで 2026-10-18 にローカルで発生）
- yomitsuzuri では、`user_master` を CASCADE で参照するのは `user_login_master`・`user_google_login_master` のみで、book 系のテーブル（`book_transaction` など）は `no action`・`restrict` で参照している。これらの子孫テーブルに行がある状態で親を DROP した場合、CASCADE で消えるのではなく DROP が失敗する可能性がある（未確認）。どちらの場合も、Step 3 の退避・戻しが必要になる
- `npm run db:migrate:local`・`npm run db:migrate:prod` の前には、`backend/scripts/check-migrations.mjs` が pre スクリプトとして自動で動き、問題があれば適用を止める
- Claude が `wrangler d1 migrations apply` を直接実行した場合も、`.claude/settings.json` の hook（`.claude/hooks/check-migration-command.mjs`）で同じ確認が動く

---

## Instructions

### Step 1: マイグレーションを生成する

1. `backend/` で `npm run db:generate` を実行する
2. 生成された `drizzle/XXXX_*.sql` と `drizzle/meta/`（`_journal.json`・`XXXX_snapshot.json`）をセットで扱う
3. 新しい SQL ファイルを手で作らない（スナップショットが更新されず、以降の生成がずれる）。drizzle-kit が扱えない変更は `npx drizzle-kit generate --custom` で空のファイルを生成してから書く
4. 生成された SQL の中身を書き換えることは許可する（Step 3 の退避・戻し）

### Step 2: 生成された SQL を確認する

1. 生成された SQL を Read で開き、`DROP TABLE` を含むかを確認する（`__new_` で始まる作り直し用テーブルへの RENAME と組で出る）
2. `DROP TABLE` があれば、そのテーブルを参照している子孫テーブルを洗い出す
   - `drizzle/meta/XXXX_snapshot.json` の `tables.*.foreignKeys`（`tableTo`・`onDelete`）を、親から子へたどる
   - 子の子も含める（例: `user_master` → `book_transaction` → `work_transaction` → `character_transaction`）
3. 子孫テーブルがある場合は、適用前にユーザーへ報告する（どのテーブルが CASCADE で消えるか、または DROP の失敗につながるか）

### Step 3: 子孫テーブルがある場合は、退避・戻しを足す

`templates/backup-restore.sql` の形で、生成された作り直しの前後に処理を足す。

- 作り直しの前：子孫テーブルを `__bak_<テーブル名>` に退避する
- 作り直しの後：子孫テーブルを子から順に空にし（DELETE）、親から順に退避した行を戻す（INSERT）
- 最後：退避用テーブルを DROP する
- 空にしてから戻すのは、`PRAGMA foreign_keys=OFF` が効いて CASCADE が起きなかった場合でも、同じ結果にするため
- 作り直しの部分（`__new_` の CREATE・INSERT・DROP・RENAME・CREATE INDEX）は、生成されたまま変えない
- `no action`・`restrict` の子孫テーブルがあり、Step 4 の検証で DROP が失敗する場合は、子孫テーブルを空にする処理を作り直しの前に移すなど、検証が通る順序をユーザーと相談して決める

### Step 4: 使い捨て D1 で検証する

すべて `backend/` で実行する。どれも本物のローカル DB・本番 DB には書き込まない。

1. ローカルの適用状態で検証する：`npm run db:check:local`
2. 本番の適用状態で検証する：
   - 本番の適用済みの最終番号をユーザーに確認し、`node --disable-warning=ExperimentalWarning scripts/check-migrations.mjs prod --applied-until <番号>` を実行する
   - Claude は本番に問い合わせない（`npm run db:check:prod` は本番の適用済み一覧を読み取るため、ユーザーが実行する）
3. `npm run db:generate` を実行し、「No schema changes」になる（新しいマイグレーションが生成されない）ことを確認する
4. `npm run test` を実行する（テストは空の DB にマイグレーションを当てる）

確認スクリプトで止められた場合は、表示された内容（足りない退避・戻し、件数が減ったテーブル、外部キーの違反）を Step 3 に戻って直し、Step 4 をやり直す。確認スクリプトを回避して適用しない。

### Step 5: 適用する

1. ローカルへの適用は DB への書き込みなので、実行前にユーザーに断る（CLAUDE.md）
2. `npm run db:migrate:local` で適用する（pre スクリプトで確認が自動で動く）。`wrangler d1 migrations apply` を直接使わない
3. 本番（`db:migrate:prod`）は Claude が実行しない。ユーザーに、変更をコミットしてから実行するよう伝える

### Step 6: 報告する

1. 適用後、作り直したテーブルと、その子孫テーブルすべての件数を読み取りで確認する
2. 適用前の件数と比べて報告する。子孫テーブルを確認していない状態で「問題なく移行できた」と報告しない

---

## Constraints

- `PRAGMA foreign_keys=OFF` や `PRAGMA defer_foreign_keys` で CASCADE を防げると考えない（`foreign_keys=OFF` がローカルの D1 で効かないことは、同じ構成の別プロジェクトで確認済み。本番の D1 は未確認だが、同じ前提で扱う）
- 確認スクリプト（pre スクリプト・hook）を回避する操作をしない（npm の `--ignore-scripts`、別名の DB への適用など）
- 本番 DB への読み書き（`--remote`）を Claude が行わない
- 確認スクリプトは、文面の確認（退避・戻しがそろっているか）と、適用先と同じ状態の使い捨て D1 に検証用データを入れて当てる確認を行う。ただし本番のデータそのものでは確認できない（本番だけに NULL の行がある、など）。その可能性がある変更（NOT NULL 化など）は、本番のデータの状態をユーザーに確認する

---

## Output Format

適用後の報告：

```
## マイグレーション適用結果

- **適用したマイグレーション**: [ファイル名]
- **作り直したテーブル**: [テーブル名]（なしの場合は「なし」）
- **件数の比較**:
  | テーブル | 適用前 | 適用後 |
  |---|---|---|
  | [作り直したテーブル] | [件数] | [件数] |
  | [子孫テーブル] | [件数] | [件数] |
- **検証**: db:check:local [結果] / 本番の適用状態での検証 [結果] / db:generate [結果] / テスト [結果]
- **本番について**: [未適用。コミット後に `npm run db:migrate:prod` を実行してください 等]
```

---

## Examples

`examples/expected-output.md` を参照。
