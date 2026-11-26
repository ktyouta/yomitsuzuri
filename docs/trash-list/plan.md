# ゴミ箱一覧取得 API

## 概要

論理削除済みの書籍（ゴミ箱の書籍）の一覧を返す API を作る。ゴミ箱の画面から、書籍を見分けて復元・完全削除を選ぶために使う。削除・復元の方針は `docs/delete-restore/plan.md` を参照。

今回の対象はバックエンドのみ。絞り込み（keyword・作成日時・更新日時）は U11 で後から追加した。フロントエンド（ゴミ箱一覧・詳細画面）は未着手。

## 決定事項

### ユーザー決定事項

- U1: ゴミ箱の詳細画面は、書籍の情報と作品名の一覧だけを読み取り専用で表示し、操作は［復元］［完全に削除］だけにする。作品以下の画面には遷移しない（2026-11-23。Claude が提示した案 B をユーザーが選択）
- U2: エンドポイントは `GET /api/v1/deleted-books?page=`、API 定数は `DELETED_BOOKS`（2026-11-23。Claude の提案をユーザーが承認）
- U3: 各層のフォルダ名は `get-list-deleted-book`（dto は `get-list-deleted-book-result`）。書籍一覧（`get-list-book`）と同じ構成にする（2026-11-23。Claude の提案をユーザーが承認）
- U4: ページ番号は `BookListPagination` を流用する（2026-11-23。Claude の提案をユーザーが承認）
- U5: 作品数は、削除済みを含めた全作品を数える（2026-11-23。Claude の提案をユーザーが承認）
  - 理由（Claude の提案）: ゴミ箱の書籍は作品がすべて削除済みのため、書籍一覧と同じ数え方では常に 0 になる。書籍の復元で個別に削除していた作品も戻る（delete-restore の U10）ため、「復元で戻る作品の数」と一致する
- U6: 一覧の行の型は `BookListItem` を使い回さず、`DeletedBookListItem` を新設する（作品数の意味が異なるため。2026-11-23。Claude の提案をユーザーが承認）
- U7: 並びは `updatedAt` 降順・`id` 降順。`updatedAt` をレスポンスに含める（2026-11-23。Claude の提案をユーザーが承認）
  - 書籍の削除で `updatedAt` を現在日時にするため、削除日時の新しい順になる。`updatedAt` は復元 API の楽観ロックにも使う
  - U13 で並び順を選べるようにしたため、この並びは `sort` を省略した場合の既定の並び順になる
- U8: 返却項目は `id, title, updatedAt, readingStatusId, readingStatusLabel, workCount, icon`（書籍一覧と同じ項目。読書状況も返す。2026-11-23 ユーザー決定）
- U9: 1ページの件数（30件）は、ゴミ箱の Usecase に別の定数として持つ（書籍一覧と共有しない。2026-11-23。Claude の提案をユーザーが選択）
- U10: コントローラーを `presentation/book/controller/index.ts` の export にも追加する（2026-11-23 ユーザー決定）
- U11: 書籍一覧と同じ絞り込みを追加する（keyword（タイトル・メモの部分一致）、作成日時・更新日時の範囲（From 以上・To 未満））。検索条件の不正な値はエラーにせず無視する（形式が不正な日時は条件から外し、不正なページ番号は1ページ目として扱う）（2026-11-25 ユーザー指示）
  - ゴミ箱では `updatedAt` が削除日時のため、更新日時の絞り込みは実質的に削除日時の絞り込みになる
- U12: 検索条件の型は書籍一覧の `BookListQueryType` を使い回さず、`DeletedBookListQueryType` を新設する（書籍一覧と独立して変えられるように。2026-11-25。Claude が提示した案 B をユーザーが選択）
- U13: 書籍一覧と同じ並び順の指定を追加する（クエリ `sort` で `updatedAtDesc`・`updatedAtAsc`・`createdAtDesc`・`createdAtAsc` を選べる。省略時・不正な値の場合は `updatedAtDesc`）。並び順は書籍一覧の `BookListSort` を流用する（2026-11-26 ユーザー指示）
  - ゴミ箱では `updatedAt` が削除日時のため、更新日時での並び替えは削除日時での並び替えになる
  - どの並び順でも `id` を第2キーにし、向きは第1キーに合わせる
  - `BookListSort` の流用は、U4（`BookListPagination` の流用）に合わせた Claude の判断（ユーザーの明示的な承認なし）

### Claudeの提案（ユーザーの明示的な承認なし）

- P1: 論理削除された読書状況・アイコンは、書籍一覧と同じく結合条件で除外して null を返す（書籍はゴミ箱から外さない。外すと復元・完全削除ができなくなるため）

## タスク

### バックエンド

| # | タスク | ファイル | 前提 |
|---|--------|----------|------|
| 1 | [x] API 定数 `DELETED_BOOKS` 追加 | `backend/src/constant/api-endpoint/api-endpoint.const.ts` | ― |
| 2 | [x] `DeletedBookListItem` と Repository interface 定義 | `backend/src/domain/book/repository/get-list-deleted-book/get-list-deleted-book.repository.interface.ts`・`index.ts`、`domain/book/repository/index.ts` | ― |
| 3 | [x] 結果 DTO 定義 + テスト | `backend/src/application/book/dto/get-list-deleted-book-result/`（`.dto.ts`・`.dto.test.ts`・`index.ts`）、`dto/index.ts` | #2 |
| 4 | [x] Usecase の契約テスト（失敗確認） | `backend/src/application/book/usecase/get-list-deleted-book/get-list-deleted-book.usecase.test.ts` | #2, #3 |
| 5 | [x] Usecase 実装 | `backend/src/application/book/usecase/get-list-deleted-book/`（`.usecase.ts`・`index.ts`）、`usecase/index.ts` | #4 |
| 6 | [x] Repository 実装 | `backend/src/infrastructure/book/repository/get-list-deleted-book/`（`.repository.ts`・`index.ts`）、`repository/index.ts` | #2 |
| 7 | [x] クエリスキーマ定義 + テスト | `backend/src/presentation/book/schema/get-list-deleted-book/`（`.schema.ts`・`.schema.test.ts`・`index.ts`）、`schema/index.ts` | ― |
| 8 | [x] Controller 実装 | `backend/src/presentation/book/controller/get-list-deleted-book/`（`.controller.ts`・`index.ts`）、`controller/index.ts` | #1, #5, #6, #7 |
| 9 | [x] ルーター登録 | `backend/src/presentation/book/controller/book/book.controller.ts` | #8 |

推奨着手順: #1 → #2 → #3 → #4 → #5 → #6 → #7 → #8 → #9

#### 絞り込みの追加（U11）

| # | タスク | ファイル | 前提 |
|---|--------|----------|------|
| 10 | [x] `DeletedBookListQueryType` 新設・Repository interface の引数変更 | `backend/src/domain/book/repository/get-list-deleted-book/get-list-deleted-book.repository.interface.ts` | ― |
| 11 | [x] Usecase の契約テスト更新（失敗確認） | `backend/src/application/book/usecase/get-list-deleted-book/get-list-deleted-book.usecase.test.ts` | #10 |
| 12 | [x] Usecase 変更 | `backend/src/application/book/usecase/get-list-deleted-book/get-list-deleted-book.usecase.ts` | #11 |
| 13 | [x] Repository 実装変更 | `backend/src/infrastructure/book/repository/get-list-deleted-book/get-list-deleted-book.repository.ts` | #10 |
| 14 | [x] クエリスキーマ変更 + テスト | `backend/src/presentation/book/schema/get-list-deleted-book/`（`.schema.ts`・`.schema.test.ts`） | ― |
| 15 | [x] Controller 変更（422 の分岐を削除） | `backend/src/presentation/book/controller/get-list-deleted-book/get-list-deleted-book.controller.ts` | #12, #14 |
| 16 | [ ] コミット | ― | #10〜#15 |

## 破綻ケース

- 削除済みの書籍の `updated_at` が、削除後に書き換わる操作ができた場合: 並びが削除日時の順でなくなり、画面の表示後に更新されたとみなされて復元が `CONFLICT_BOOK` になる。読書進捗の更新・タグの付け外し（API 定数 `BOOKS_ID_READING_PROGRESS`・`BOOKS_ID_TAGS_ID` のみ存在し未実装）を作るときは、削除済みの書籍を対象から外す必要がある
- ゴミ箱だけページ番号の上限・下限を変えたくなった場合: `BookListPagination` を分ける
- ゴミ箱だけ並び順の種類を変えたくなった場合（例: 書籍一覧にだけタイトル順を足す）: `BookListSort` を分ける
- 「アプリ内の一覧はすべて同じ件数」という要件が出た場合: 件数の定数を共有の場所に寄せる

## クラス仕様（契約）

### GetListDeletedBookUsecase（application）

- **不変条件**: なし
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `execute({ userId, query })` | なし | 一覧・全件数は Repository の結果をそのまま返し、`totalPages = ceil(total / 30)`（0件なら空の一覧・総ページ数0）。一覧は指定したユーザー・検索条件・30件で、件数は同じ検索条件で問い合わせる。検索条件の不正な値はエラーにせず無視する（形式が不正な日時は条件から外し、並び順が省略・不正なら `updatedAtDesc`、ページ番号が不正（1未満・整数でない・NaN）なら1ページ目として扱う）。当初は不正なページ番号で `INVALID_INPUT` を返していたが、U11 で変更した | なし |

- **テストケース**: 一覧・全件数をそのまま返し総ページ数2（31件）／0件で空・総ページ数0／30件ちょうどで総ページ数1／ユーザー・検索条件・30件で一覧を、同じ検索条件で件数を問い合わせる／日時の指定なしで日時の条件なし／不正な形式の日時だけを条件から外す／ページ番号 0・1.5・NaN で1ページ目として問い合わせる／指定した並び順で問い合わせる／並び順の省略・空文字・不正な値で `updatedAtDesc` として問い合わせる

### GetListDeletedBookResultDto（application）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `constructor(list, total, totalPages)` | なし | `value` が `{ list: 各行の7項目, total, totalPages }` になる | なし |

- **テストケース**: 一覧・全件数・総ページ数から DTO を生成できる

### IGetListDeletedBookRepository（domain interface / infrastructure 実装）

| メソッド | 事後条件 |
|---|---|
| `findDeletedBookList(userId, query, pageSize)` | 指定ユーザーの削除済みの書籍のうち検索条件に合うもの（keyword はタイトル・メモの部分一致、日時は From 以上・To 未満。指定がない項目は条件にしない）を検索条件の並び順（`id` を第2キーにし、向きは第1キーに合わせる）で、指定ページ分（最大 pageSize 件）返す。`workCount` は削除済みを含む全作品の数（U5）。論理削除された読書状況・アイコンは null（P1） |
| `countDeletedBook(userId, query)` | 一覧と同じ抽出条件（検索条件を含む。ページ番号は使わない）での件数を返す |

- **テストケース**: Repository のテスト基盤がないため、なし（実際の DB では未確認）

### GetListDeletedBookQuerySchema（presentation）

| 対象 | 事後条件 |
|---|---|
| `page` | 文字列を数値に変換する。省略時は1。値の制約は判定しない（NaN も通す） |
| `keyword`・`createdAtFrom`・`createdAtTo`・`updatedAtFrom`・`updatedAtTo` | 文字列のまま通す。省略時は undefined。値の制約は判定しない |

- **テストケース**: 省略で1／"2"→2／"0"・"1.5"・"" を判定せず数値で通す／"abc" を NaN で通す／keyword・日時の省略で undefined／keyword・日時を判定せず文字列のまま通す
