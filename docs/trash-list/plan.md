# ゴミ箱一覧取得 API

## 概要

論理削除済みの書籍（ゴミ箱の書籍）の一覧を返す API を作る。ゴミ箱の画面から、書籍を見分けて復元・完全削除を選ぶために使う。削除・復元の方針は `docs/delete-restore/plan.md` を参照。

今回の対象はバックエンドのみ。フロントエンド（ゴミ箱一覧・詳細画面）は未着手。

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
- U8: 返却項目は `id, title, updatedAt, readingStatusId, readingStatusLabel, workCount, icon`（書籍一覧と同じ項目。読書状況も返す。2026-11-23 ユーザー決定）
- U9: 1ページの件数（30件）は、ゴミ箱の Usecase に別の定数として持つ（書籍一覧と共有しない。2026-11-23。Claude の提案をユーザーが選択）
- U10: コントローラーを `presentation/book/controller/index.ts` の export にも追加する（2026-11-23 ユーザー決定）

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

## 破綻ケース

- 削除済みの書籍の `updated_at` が、削除後に書き換わる操作ができた場合: 並びが削除日時の順でなくなり、画面の表示後に更新されたとみなされて復元が `CONFLICT_BOOK` になる。読書進捗の更新・タグの付け外し（API 定数 `BOOKS_ID_READING_PROGRESS`・`BOOKS_ID_TAGS_ID` のみ存在し未実装）を作るときは、削除済みの書籍を対象から外す必要がある
- ゴミ箱だけページ番号の上限・下限を変えたくなった場合: `BookListPagination` を分ける
- 「アプリ内の一覧はすべて同じ件数」という要件が出た場合: 件数の定数を共有の場所に寄せる

## クラス仕様（契約）

### GetListDeletedBookUsecase（application）

- **不変条件**: なし
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `execute({ userId, page })` | なし | ページ番号が正しい場合は ok。一覧・全件数は Repository の結果をそのまま返し、`totalPages = ceil(total / 30)`（0件なら空の一覧・総ページ数0）。一覧は指定したユーザー・ページ番号・30件で問い合わせる。ページ番号が不正（1未満・整数でない・NaN）の場合は `INVALID_INPUT`（field: `page`, error: `BOOK_LIST_PAGE_INVALID`）を返し、一覧・件数を問い合わせない | なし |

- **テストケース**: 一覧・全件数をそのまま返し総ページ数2（31件）／0件で空・総ページ数0／ユーザー・ページ2・30件で一覧を、同じユーザーで件数を問い合わせる／30件ちょうどで総ページ数1／ページ番号 0・1.5・NaN で INVALID_INPUT かつ問い合わせなし

### GetListDeletedBookResultDto（application）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `constructor(list, total, totalPages)` | なし | `value` が `{ list: 各行の7項目, total, totalPages }` になる | なし |

- **テストケース**: 一覧・全件数・総ページ数から DTO を生成できる

### IGetListDeletedBookRepository（domain interface / infrastructure 実装）

| メソッド | 事後条件 |
|---|---|
| `findDeletedBookList(userId, pagination, pageSize)` | 指定ユーザーの削除済みの書籍を `updatedAt` 降順・`id` 降順で、指定ページ分（最大 pageSize 件）返す。`workCount` は削除済みを含む全作品の数（U5）。論理削除された読書状況・アイコンは null（P1） |
| `countDeletedBook(userId)` | 一覧と同じ抽出条件での全件数を返す |

- **テストケース**: Repository のテスト基盤がないため、なし（実際の DB では未確認）

### GetListDeletedBookQuerySchema（presentation）

| 対象 | 事後条件 |
|---|---|
| `page` | 文字列を数値に変換する。省略時は1。値の制約は判定しない（NaN も通す） |

- **テストケース**: 省略で1／"2"→2／"0"・"1.5"・"" を判定せず数値で通す／"abc" を NaN で通す
