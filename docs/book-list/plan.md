# 書籍一覧取得API（GET /api/v1/books）

## 概要

ログインユーザー自身の書籍一覧をページング付きで返す。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- ページングあり（クエリ `page`、レスポンス `{ list, total, totalPages }`）
- 並び順は updatedAt 降順（後から追加: クエリ `sort` で `updatedAtDesc`・`updatedAtAsc`・`createdAtDesc`・`createdAtAsc` を選べる。省略時・不正な値の場合は `updatedAtDesc`。2026-11-26 ユーザー実装）
- 返却項目: id, title, updatedAt, readingStatusId（読書状況ID）, readingStatusLabel（表示名）, workCount, icon（絵文字）
- 読書状況は `reading_status_master` を新設して JOIN し、読書状況IDと表示名をフラットに返す
- 読み始めた日・タグ数・著者は返さない
- 絞り込みは今回なし（後から追加: keyword（タイトル・メモの部分一致）、作成日時・更新日時の範囲（From 以上・To 未満。フロントが利用者の時間の日付を UTC の日時に変換して送り、To は終了日の翌日 0:00 にする））
- 検索条件の不正な値はエラーにせず無視する（形式が不正な日時は条件から外し、不正な並び順は `updatedAtDesc`、不正なページ番号は1ページ目として扱う）
- 主キーを `id`（integer）にし、`book_transaction.reading_status_id` から FK で参照する（`icon_master` と同じ形。当初の「コード値（text）を主キー」から、ユーザー指示で変更）
- 論理削除された読書状況は readingStatusLabel を null にする（Claude提案をユーザー承認）
- page の上限（MAX_PAGE）は設けない
- 論理削除された絵文字は返さない（icon を null にし、フロント側でデフォルト絵文字を表示する）
- マイグレーション生成は今回のスコープ外（コードの完成のみ）
- `application/book/usecase/index copy.ts` は削除する

### Claudeの提案をユーザーが承認したもの

- P1: 1ページ 30 件
- P2: page は 1 始まり、省略時は 1
- P3: 範囲外ページは 200 で空 list を返し、total / totalPages は実数を返す
- P4: 0 件のとき totalPages = 0
- P6: updatedAt が同じ場合の第2ソートキーは id 降順
  - 並び順の追加（2026-11-26 ユーザー実装）で、どの並び順でも id を第2キーにし、向きは第1キーに合わせる（降順なら id 降順、昇順なら id 昇順）

## 設計

- Repository: `findBookList(userId, query, pageSize)` が検索条件に合う書籍の指定ページの一覧を、`countBook(userId, query)` が検索条件に合う件数を返す。抽出条件は両者で共通化する（件数側への条件適用漏れを防ぐため）
- Usecase: `findBookList` と `countBook` を `Promise.all` で並列に実行する（一覧と件数は別クエリのため、間に登録・削除があると一致しない可能性があるが、自分の書籍のみが対象のため許容する）
- `BookListItem` は表示用の読み取り結果のため、id・readingStatusId を値オブジェクトで包まずプリミティブで返す
- Usecase は `UserId` を受け取る（Controller は認証済みユーザーの `UserId` をそのまま渡す）
- workCount: SELECT 句の相関サブクエリ（`work_transaction.delete_flg = false` の件数）
- readingStatusLabel: `reading_status_master` を LEFT JOIN（結合条件に `delete_flg = false`）。削除済みの場合は null
- icon: `icon_master` を LEFT JOIN（結合条件に `delete_flg = false`）。削除済み・未結合の場合は null
- page 検証: zod は文字列から数値への変換と省略時の既定値（`MIN_PAGE`）のみを行い、ページ番号として正しいかは値オブジェクト `BookListPagination` で判定する（当初は zod と値オブジェクトの二段構えだったが、絞り込みの追加時に変更した）
- 1ページあたりの最大取得件数（`PAGE_SIZE` = 30）は Usecase が持ち、Repository に渡す。offset（`(page-1)*pageSize`）は Repository、totalPages（`ceil(total/PAGE_SIZE)`）は Usecase で算出する
- 値オブジェクト `BookListPagination` は page の検証のみを担う

### 破綻ケース

- 一覧と件数の厳密な一致が必要になった場合: `db.batch` で同一トランザクション内で取得する形に戻す必要がある
- ページングする一覧が他にも増える場合: 汎用 Pagination への抽出が必要
- 絞り込みを追加する場合: Repository 引数の条件オブジェクト化が必要（COUNT 側への条件適用漏れに注意）
- 読書状況をユーザーごとに追加可能にする場合: マスタに user_id が必要になる
- 特定の読書状況に依存する処理（例: 読了時に読了日を記録）が必要になる場合: 主キーの id では意味を表せないため、`code` 列（unique）の追加が必要
- `book_transaction.reading_status_id` のデフォルト（`ReadingStatusId.INITIAL` = 1、未読）は、マスタ初期データの id=1 が未読であることに依存する
- 書籍数が大きく深いページを開く場合: OFFSET 方式からカーソル方式への変更が必要

## タスク

### バックエンド

- [x] `application/book/usecase/index copy.ts` を削除する
- [x] 値オブジェクト `BookListPagination`（`domain/book/value-object/book-list-pagination/`）
- [x] Repository interface `IGetListBookRepository`（`domain/book/repository/get-list-book/get-list-book.repository.interface.ts`）
- [x] Usecase `GetListBookUsecase`・DTO `GetListBookResultDto` を作り直す
- [x] Repository 実装 `GetListBookRepository`（`infrastructure/book/repository/`）
- [x] zod スキーマ `GetListBookQuerySchema`（`presentation/book/schema/`）
- [x] Controller `getListBook` を作り直し、集約ルーター `book` を作成して `src/index.ts` に登録する
- [x] `schema.ts` に `reading_status_master` を追加し、`book_transaction.reading_status` に FK を付与する
- [x] 読書状況を値オブジェクト `ReadingStatusId`（`domain/book/value-object/reading-status-id/`）で表す（値の一覧はマスタのみで管理する）
- [x] index.ts の再エクスポート（domain / application / infrastructure / presentation）

### スコープ外

- マイグレーション生成（読書関連テーブル一式・icon_master・reading_status_master 初期データ）
- コントローラー結合テスト（マイグレーション未生成のため、テーブルがなく実行できない）
- フロントエンド

## クラス仕様（契約）

### BookListPagination（Value Object）

- **不変条件**: value は `MIN_PAGE`（1）以上の整数

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `FIRST`（定数） | なし | value は `MIN_PAGE`（1） | なし |
| `create(page)` | なし | page が `MIN_PAGE` 以上の整数なら value が page のインスタンスを ok で返す。それ以外（NaN を含む）は `BOOK_LIST_PAGE_INVALID`（最小値 `min` 付き）を err で返す | なし |

- **テストケース**: FIRST の value が 1 / create(2) で value が 2 / create に 0・-1・1.5・NaN で `BOOK_LIST_PAGE_INVALID`（min=1）

### BookListSort（Value Object）

- **不変条件**: value は `SORTS`（`updatedAtDesc`・`updatedAtAsc`・`createdAtDesc`・`createdAtAsc`）のいずれか

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `DEFAULT`（定数） | なし | value は `updatedAtDesc` | なし |
| `create(sort)` | なし | sort が省略・空文字なら `DEFAULT` を ok で返す。`SORTS` のいずれかと完全一致すれば value が sort のインスタンスを ok で返す。それ以外は `BOOK_LIST_SORT_INVALID` を err で返す | なし |

- **テストケース**: DEFAULT の value が `updatedAtDesc` / SORTS の各値で value がその値 / undefined・空文字で DEFAULT / "abc"・"UpdatedAtDesc"・"updatedAt"・" updatedAtDesc" で `BOOK_LIST_SORT_INVALID`

### ReadingStatusId（Value Object）

- **不変条件**: value は 1 以上の整数

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `create(readingStatusId)` | なし | 1 以上の整数なら value が引数のインスタンスを ok で返す。それ以外（NaN を含む）は `READING_STATUS_ID_INVALID` を err で返す | なし |
| `of(readingStatusId)` | readingStatusId が 1 以上の整数（Error。DB 等の信頼できる値からの生成に使う） | value は引数の値 | なし |
| `initial()` | なし | value は `INITIAL`（1、未読） | なし |

- **テストケース**: create(1) で生成できる / create に 0・-1・1.5・NaN で `READING_STATUS_ID_INVALID` / of で制約を満たす値から生成できる / of で制約を満たさない値は throw / initial() の value が 1
- マスタに存在するかは FK で保証する（値オブジェクトでは確認しない）

### GetListBookUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| `execute({ userId, query })` | なし（userId の妥当性は `UserId` 型で保証する） | 一覧・全件数は Repository の結果をそのまま返し、`totalPages = ceil(total / 30)`（0件なら空の一覧・総ページ数0）。一覧は指定したユーザー・検索条件・30件で、件数は同じ検索条件で問い合わせる。検索条件の不正な値はエラーにせず無視する（形式が不正な日時は条件から外し、並び順が省略・不正なら `updatedAtDesc`、ページ番号が不正（1未満・整数でない・NaN）なら1ページ目として扱う）。当初は不正なページ番号で例外にしていたが、絞り込みの追加時に変更した | なし |

- **テストケース**: 一覧・全件数をそのまま返し総ページ数2（31件）／0件で空・総ページ数0／30件ちょうどで総ページ数1／ユーザー・検索条件（並び順を含む）・30件で一覧を、同じ検索条件で件数を問い合わせる／日時の指定なしで日時の条件なし／不正な形式の日時だけを条件から外す／ページ番号 0・1.5・NaN で1ページ目として問い合わせる／並び順の省略・空文字・不正な値で `updatedAtDesc` として問い合わせる
- offset の算出・並び順の SQL への変換は Repository 実装にあり、単体テストの対象外（Repository のテストがないため）

### その他

- DTO: 一覧・全件数・総ページ数から生成できること
- zod スキーマ: 型と構造だけを検証し、値の制約は判定しない（値オブジェクトで判定する）。page は省略時 1・"2"→2、"0"・"1.5"・"" も判定せず数値に変換して通し、"abc" は NaN として通す。keyword・日時・並び順は省略時 undefined、指定時は判定せず文字列のまま通す
