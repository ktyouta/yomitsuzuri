# 削除済みの書籍の詳細取得 API

## 概要

ゴミ箱の詳細画面に表示する、削除済みの書籍の詳細を返す API を作る。画面の方針は `docs/trash-list/plan.md` の U1、削除・復元の方針は `docs/delete-restore/plan.md` を参照。

今回の対象はバックエンドのみ。フロントエンドは未着手。

## 決定事項

### ユーザー決定事項

- U1: エンドポイントは `GET /api/v1/deleted-books/:bookId`、API 定数は `DELETED_BOOKS_ID`（2026-11-23。Claude の提案をユーザーが承認）
- U2: 書籍の返却項目は `id, title, publishedDate, readingStatusId, readingStatusLabel, currentPage, memo, icon, updatedAt` と著者 `authors[{ name }]`（`iconId` は返さず、アイコンは絵文字の `icon` だけ。2026-11-23 ユーザー決定）
- U3: 作品の返却項目は `works[{ id, title, memo, icon }]`（メモ・アイコンはとりあえず入れ、画面を見て不要ならその時に外す。2026-11-23 ユーザー決定）
- U4: 作品の並びは、書籍の復元後の並びと同じにする。表示順を持つ作品を表示順の昇順で並べ、その後に表示順が null の作品（個別に削除していた作品）を ID の昇順で並べる（2026-11-23。Claude の提案をユーザーが承認）
  - 理由（Claude の提案）: 書籍の復元で、表示順が null の作品は ID 順に末尾に付けられる（delete-restore の U13）。既存の書籍詳細と同じ昇順では、SQLite で null が先頭に来て、復元後の並びと食い違う
- U5: 既存の書籍詳細取得（get-book）は流用せず、各層に `get-deleted-book` を新設する。型は `DeletedBookItem`・`DeletedBookWorkItem` を新設し、著者は `AuthorItem` を流用する（2026-11-23。Claude の提案をユーザーが承認）

### Claudeの提案（ユーザーの明示的な承認なし）

- P1: 作品・著者は、削除フラグで絞り込まず全件返す（書籍の復元でまとめて戻るため。delete-restore の U10・U14）。著者の並びは既存と同じ表示順・ID の昇順
- P2: 存在しない・他ユーザーの・削除されていない書籍は NOT_FOUND として、既存と同じ 404「書籍が見つかりませんでした。」を返す
- P3: 論理削除された読書状況・アイコンは、結合条件で除外して null を返す（trash-list の P1 と同じ）
- P4: パスパラメータのスキーマは `BookIdParamSchema` を流用する
- P5: 成功時のメッセージは「ゴミ箱の書籍詳細を取得しました。」（ゴミ箱一覧の文言に合わせた）

## タスク

### バックエンド

| # | タスク | ファイル | 前提 |
|---|--------|----------|------|
| 1 | [x] API 定数 `DELETED_BOOKS_ID` 追加 | `backend/src/constant/api-endpoint/api-endpoint.const.ts` | ― |
| 2 | [x] `DeletedBookItem`・`DeletedBookWorkItem` と Repository interface 定義 | `backend/src/domain/book/repository/get-deleted-book/`（`.repository.interface.ts`・`index.ts`）、`domain/book/repository/index.ts` | ― |
| 3 | [x] 結果 DTO 定義 + テスト | `backend/src/application/book/dto/get-deleted-book-result/`（`.dto.ts`・`.dto.test.ts`・`index.ts`）、`dto/index.ts` | #2 |
| 4 | [x] Usecase の契約テスト（失敗確認） | `backend/src/application/book/usecase/get-deleted-book/get-deleted-book.usecase.test.ts` | #2, #3 |
| 5 | [x] Usecase 実装 | `backend/src/application/book/usecase/get-deleted-book/`（`.usecase.ts`・`index.ts`）、`usecase/index.ts` | #4 |
| 6 | [x] Repository 実装 | `backend/src/infrastructure/book/repository/get-deleted-book/`（`.repository.ts`・`index.ts`）、`repository/index.ts` | #2 |
| 7 | [x] Controller 実装 | `backend/src/presentation/book/controller/get-deleted-book/`（`.controller.ts`・`index.ts`）、`controller/index.ts` | #1, #5, #6 |
| 8 | [x] ルーター登録 | `backend/src/presentation/book/controller/book/book.controller.ts` | #7 |

推奨着手順: #1 → #2 → #3 → #4 → #5 → #6 → #7 → #8

## クラス仕様（契約）

### GetDeletedBookUsecase（application）

- **不変条件**: なし
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `execute({ userId, bookId })` | bookId が空でない（`BookId.of` が「書籍IDが設定されていません。」を throw。書籍・作品・著者は問い合わせない） | 書籍が取得できた場合は、書籍情報・作品一覧・著者一覧をそのまま DTO にして ok。取得できない（存在しない・他ユーザー・削除されていない）場合は `NOT_FOUND`。書籍・作品・著者は指定したユーザー・書籍IDで問い合わせる | なし |

- **テストケース**: 取得結果をそのまま返す／書籍が取得できない場合 NOT_FOUND／指定したユーザー・書籍IDで3つとも問い合わせる／書籍IDが空の場合は例外で、3つとも問い合わせない

### GetDeletedBookResultDto（application）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `constructor(book, works, authors)` | なし | `value` が書籍の項目（U2）に `works`（U3 の項目・受け取った順）・`authors` を加えたものになる | なし |

- **テストケース**: 書籍情報・作品一覧・著者一覧から DTO を生成でき、作品を受け取った順のまま返す（作品2件で確認）

### IGetDeletedBookRepository（domain interface / infrastructure 実装）

| メソッド | 事後条件 |
|---|---|
| `findDeletedBook(userId, bookId)` | 指定ユーザーの論理削除済みの指定書籍を返す。存在しない・他ユーザー・削除されていない場合は null。論理削除された読書状況・アイコンは null（P3） |
| `findDeletedBookWork(userId, bookId)` | 作品の削除フラグを問わず全件を、表示順の昇順（null は末尾）・ID の昇順で返す（U4・P1）。書籍が対象外なら空配列 |
| `findDeletedBookAuthor(userId, bookId)` | 著者の削除フラグを問わず全件を、表示順・ID の昇順で返す（P1）。書籍が対象外なら空配列 |

- **テストケース**: Repository のテスト基盤がないため、なし（実際の DB では未確認）
