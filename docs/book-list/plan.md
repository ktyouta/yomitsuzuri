# 書籍一覧取得API（GET /api/v1/books）

## 概要

ログインユーザー自身の書籍一覧をページング付きで返す。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- ページングあり（クエリ `page`、レスポンス `{ list, total, totalPages }`）
- 並び順は updatedAt 降順
- 返却項目: id, title, updatedAt, readingStatus（コード）, readingStatusLabel（表示名）, workCount, icon（絵文字）
- 読書状況は `reading_status_master` を新設して JOIN し、コードと表示名をフラットに返す
- 読み始めた日・タグ数・著者は返さない
- 絞り込みは今回なし
- 主キーをコード値（text）にし、`book_transaction.reading_status` から FK で参照する（Claude提案をユーザー承認）
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

## 設計

- Repository: `findList(userId, pagination)` が `{ list, total }` を返す。内部は `db.batch` で SELECT（LIMIT/OFFSET）と COUNT を1往復で実行する
- workCount: SELECT 句の相関サブクエリ（`work_transaction.delete_flg = false` の件数）
- readingStatusLabel: `reading_status_master` を LEFT JOIN（結合条件に `delete_flg = false`）。削除済みの場合は null
- icon: `icon_master` を LEFT JOIN（結合条件に `delete_flg = false`）。削除済み・未結合の場合は null
- page 検証: zod（`z.coerce.number().int().min(BookListPagination.MIN_PAGE).default(BookListPagination.MIN_PAGE)`）と値オブジェクト `BookListPagination` の二段構え
- offset / limit / totalPages の計算は値オブジェクト `BookListPagination` に集約する

### 破綻ケース

- ページサイズを可変にする場合: 値オブジェクトのコンストラクタ変更が必要
- ページングする一覧が他にも増える場合: 汎用 Pagination への抽出が必要
- 絞り込みを追加する場合: Repository 引数の条件オブジェクト化が必要（COUNT 側への条件適用漏れに注意）
- 読書状況をユーザーごとに追加可能にする場合: マスタに user_id が必要になり、コード値の主キーが重複する
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
- [x] 読書状況コードを `BOOK_READING_STATUSES`（`domain/book/value-object/book-reading-status/`）に一本化し、`schema.ts` から参照する
- [x] index.ts の再エクスポート（domain / application / infrastructure / presentation）

### スコープ外

- マイグレーション生成（読書関連テーブル一式・icon_master・reading_status_master 初期データ）
- コントローラー結合テスト（マイグレーション未生成のため、テーブルがなく実行できない）
- フロントエンド

## クラス仕様（契約）

### BookListPagination（Value Object）

- **不変条件**: page は 1 以上の整数。limit は 30。offset は (page-1)*30

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| constructor(page) | page が 1 以上の整数（Error） | page は引数の値 | なし |
| limit | なし | 30 を返す | なし |
| offset | なし | (page-1)*30 を返す | なし |
| totalPages(total) | total が 0 以上の整数（Error） | ceil(total/30) を返す（0 なら 0） | なし |

- **テストケース**: page=1 で offset=0・limit=30 / page=2 で offset=30 / page が 0・-1・1.5・NaN で例外 / totalPages の境界 0→0・1→1・30→1・31→2 / totalPages に -1・1.5 で例外

### GetListBookUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute(userId, page) | userId が空でない・page が上記の事前条件を満たす（Error。違反時は Repository を呼ばない） | page に対応する offset・limit で userId の一覧を返す。list・total は Repository の結果どおり。totalPages = ceil(total/30) | なし |

- **テストケース**: list・total をそのまま返し total=31 で totalPages=2 / total=0 で空 list・totalPages=0 / page=2 で Repository に offset=30・limit=30 が渡る / 渡した userId が Repository に届く / userId が空で例外・Repository 未呼び出し / page=0 で例外・Repository 未呼び出し

### その他

- DTO: 各項目がそのまま写像されること
- zod スキーマ: 省略時 1 / "2"→2 / "0"・"-1"・"1.5"・"abc"・"" はエラー
