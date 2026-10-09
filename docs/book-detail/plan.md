# 書籍詳細取得API（GET /api/v1/books/:bookId）

## 概要

ログインユーザー自身の書籍1件の詳細と、収録されている作品一覧を返す。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 取得方法は案A（Repository の `findBook` と `findWork` を `Promise.all` で並列実行し、書籍が null なら Usecase が `NOT_FOUND` を返す）
- 設計を `docs/book-detail/plan.md` に残す
- bookId は zod スキーマでパスパラメータとして検証し、ULID 形式（26文字・Crockford's Base32 の大文字）でない場合は DB に問い合わせず 422 を返す

### Claudeの提案（ユーザーは「案Aで進めて」と指示。以下の項目は個別の明示的な承認なし）

- P1: 返却項目
  - book: id, title, publishedDate, readingStatusId, readingStatusLabel, currentPage, memo, iconId, icon（絵文字）, updatedAt
  - works: id, title, sort, memo
- P2: 論理削除された読書状況は readingStatusLabel を null、論理削除されたアイコンは icon を null にする（書籍一覧と同じ扱い）。iconId は書籍に保存されている値をそのまま返す
- P3: 作品は論理削除されていないものだけを sort の昇順で返す
- P4: 書籍が存在しない・他ユーザーの書籍・論理削除済みのいずれも 404 で同じメッセージを返す（他ユーザーの書籍の存在を推測させないため）
- ~~P5: bookId の形式（ULID）は検証しない。不正な値は該当なしとして 404 にする~~ → ユーザー指示で変更（上記「ユーザー決定事項」）
- P6: workCount は返さない（works の件数で分かるため）

## 設計

- Repository: `findBook(userId, bookId)` が書籍1件（なければ null）、`findWork(userId, bookId)` が作品一覧を返す。どちらも `book_transaction.user_id` と `delete_flg = false` を条件に含める（`findWork` は書籍を INNER JOIN して条件を付与する）
- Usecase: `findBook` と `findWork` を `Promise.all` で並列実行する。書籍が null の場合は `err({ type: "NOT_FOUND" })`、それ以外は `ok(GetBookResultDto)` を返す
- `BookItem` / `WorkItem` は表示用の読み取り結果のため、値オブジェクトで包まずプリミティブで返す
- readingStatusLabel・icon: マスタを LEFT JOIN（結合条件に `delete_flg = false`）
- bookId はパスパラメータを zod スキーマ `BookIdParamSchema`（`presentation/book/schema/book-id-param/`。ULID 形式でなければ拒否）で検証し、文字列のまま Usecase に渡す。Usecase が `BookId.of` で包む（Controller で VO を生成しないため）。検証エラーは既存エンドポイントに合わせて 422「バリデーションエラー」を返す（ユーザー指示で zod スキーマを追加）

### 破綻ケース

- 書籍と作品の内容の厳密な一致が必要になった場合: 2クエリ間に更新が入るとずれる可能性があるため、1メソッド内で `db.batch` を使う形（案B）に変更が必要
- 書籍が存在しない場合も作品取得のクエリが発行される（並列実行のため）。クエリ数が問題になる場合は逐次実行に変更する
- 作品数が非常に多くなる場合: 作品一覧のページングが必要
- 削除済みの書籍を詳細表示する要件（ゴミ箱など）が追加された場合: 抽出条件の変更が必要

## タスク

### バックエンド

- [x] Repository interface `IGetBookRepository`（`domain/book/repository/get-book/get-book.repository.interface.ts`）
- [x] Repository 実装 `GetBookRepository`（`infrastructure/book/repository/get-book/`）
- [x] DTO `GetBookResultDto`（`application/book/dto/get-book-result/`）
- [x] Usecase `GetBookUsecase`（`application/book/usecase/get-book/`）
- [x] Controller `getBook` を作成し、集約ルーター `book` に登録する
- [x] index.ts の再エクスポート（domain / application / infrastructure / presentation）

### スコープ外

- マイグレーション生成
- コントローラー結合テスト（マイグレーション未生成のため、テーブルがなく実行できない）
- フロントエンド

## クラス仕様（契約）

### GetBookUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute(userId, bookId) | bookId が空でない（Error。違反時は Repository を呼ばない）。userId の妥当性は `UserId` 型で保証する | userId・bookId で書籍と作品一覧を問い合わせる。書籍が null の場合は `NOT_FOUND`。それ以外は書籍・作品一覧を Repository の結果どおりに返す | なし |

- **テストケース**: 書籍と作品一覧をそのまま返す / 書籍が null の場合 NOT_FOUND / findBook・findWork に userId・bookId が渡る / bookId が空の場合は例外・findBook・findWork 未呼び出し

### その他

- DTO: 各項目がそのまま写像されること
- zod スキーマ `BookIdParamSchema`: ULID 形式で通る / 空文字・25文字・27文字・小文字・ULID で使わない文字（I）はエラー
