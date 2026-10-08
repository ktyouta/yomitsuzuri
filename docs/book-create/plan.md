# 書籍登録API（POST /api/v1/books）

## 概要

ログインユーザーの書籍を1件登録する。登録時に書籍タイトルと同名の作品を1件自動作成する（README「書籍と作品」）。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 範囲は API 全体（Usecase・DTO・Repository 実装・アイコン有効性判定・Controller・zod スキーマ・ルート登録）
- 登録項目はタイトル・出版日・現在のページ数・メモ・アイコンのみ。著者・タグは登録しない（別 API で追加する）
- 同一ユーザー内で同名の書籍（未削除）が存在する場合はエラーにする
- レスポンスは書籍と自動作成された作品の内容を返す

### Claudeの提案をユーザーが承認したもの

- 成功時 201、タイトル重複は 409、アイコン不正は 422（ranking-maker と同じ）
- アイコンは必須項目にする
- アイコン有効性判定（ドメインサービス・Repository）は book モジュールに置く（現状アイコンを使うのは書籍のみのため domain/shared には置かない）
- 下書きの `VALIDATION` エラー種別は削除する（`BookAggregate.generate` は Result を返さず、集約時の違反が存在しないため）
- タイトル重複判定は、集約を生成した後に集約の書籍IDを渡して行う（新規 ID のため自己除外は実質的に無効。更新 API と同じサービスを使えるようにする）
- DTO は `BookAggregate.toSnapshot()` から組み立てる（DB の再取得はしない）。userId・deleteFlg は返さない
- zod スキーマは値オブジェクトと同じ制約をかけ、文字列は trim してから検証する（空白のみのタイトルが値オブジェクトの例外＝500 にならないようにするため）

## 設計

- Controller: 認証済みユーザーの `UserId` とリクエストボディを Usecase に渡し、結果を `result.match` でレスポンスに変換する
- Usecase `CreateBookUsecase.execute({ userId, body })`
  1. アイコンが icon_master に存在し未削除かを判定する（不正なら `INVALID_ICON`）
  2. `BookAggregate.generate` で書籍集約を生成する（作品1件を自動作成）
  3. 同名書籍の有無を判定する（重複なら `DUPLICATE_TITLE`）
  4. Repository で書籍と作品を保存する
  5. 集約から DTO を作って返す
- Repository `createBook(book)`: `db.batch` で book_transaction と work_transaction を1トランザクションで INSERT する
- リクエスト: `{ title: string, publishedDate?: string | null, currentPage?: number | null, memo?: string | null, icon: number }`
- レスポンス: `{ id, title, publishedDate, readingStatusId, currentPage, memo, icon, works: [{ id, title, sort, memo }] }`

### 破綻ケース

- 同時に同名の書籍を登録した場合: 重複判定と INSERT の間に競合があるため、両方登録される可能性がある（DB に一意制約がないため）。厳密に防ぐ必要が出たら部分一意インデックスが必要
- 登録時に著者・タグも受け付ける場合: 集約・Repository・スキーマの拡張が必要
- アイコンを書籍以外（作品・登場人物など）でも使う場合: アイコン有効性判定を domain/shared へ移す検討が必要
- 同名でも別の書籍として登録したい要件（新装版・別出版社版など）が出た場合: 重複判定の撤廃または判定条件の変更が必要

## タスク

### バックエンド

- [x] Repository interface `IIconValidityRepository`（`domain/book/repository/icon-validity/`）
- [x] ドメインサービス `IconValidityDomainService`（`domain/book/service/icon-validity/`）
- [x] 既存の `BookTitleUniquenessDomainService` / `IBookTitleUniquenessRepository` のコメント修正（ランキング → 書籍）・型 import の整理・契約テスト追加
- [x] Repository interface `ICreateBookRepository` のコメント修正
- [x] DTO `CreateBookResultDto`（`application/book/dto/create-book-result/`）
- [x] Usecase `CreateBookUsecase`（`application/book/usecase/create-book/`）
- [x] Repository 実装 `IconValidityRepository`・`CreateBookRepository`（`infrastructure/book/repository/`）
- [x] zod スキーマ `CreateBookSchema`（`presentation/book/schema/create-book/`）
- [x] Controller `createBook`（`presentation/book/controller/create-book/`）を作成し、集約ルーター `book` に登録する
- [x] index.ts の再エクスポート

### スコープ外

- 著者・タグの登録
- コントローラー結合テスト・Repository のテスト（マイグレーション未生成のため）
- フロントエンド

## クラス仕様（契約）

### IconValidityDomainService（Domain Service）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| isValid(iconId) | なし | Repository `exists` の結果をそのまま返す | なし |

- **テストケース**: exists が true → true / false → false / 渡した iconId が Repository に届く

### BookTitleUniquenessDomainService（Domain Service）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| isDuplicated({ userId, bookId, bookTitle }) | なし | Repository が1件以上返せば true、0件なら false | なし |

- **テストケース**: 1件 → true / 0件 → false / 渡した値が Repository に届く

### CreateBookResultDto（DTO）

- **事後条件**: 集約のスナップショットのうち userId・deleteFlg を除く書籍の項目と、作品一覧（id・title・sort・memo）をそのまま写像する
- **テストケース**: generate した集約から上記の形になる

### CreateBookUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, body }) | body が各値オブジェクトの制約を満たす（Error。違反時は保存しない） | アイコン無効 → err(INVALID_ICON)・保存しない / 同名書籍あり → err(DUPLICATE_TITLE)・保存しない / それ以外 → 書籍（読書状況は未読）と同名作品1件を保存し、その内容の DTO を ok で返す | 書籍ID・作品ID（ULID）は集約内で採番 |

- **テストケース**: 正常系で ok・保存した集約と DTO の内容が入力どおり・作品1件が書籍と同名・読書状況1 / 出版日・ページ数・メモ未指定で null / アイコン無効で INVALID_ICON・保存しない / タイトル重複で DUPLICATE_TITLE・保存しない / 重複判定に userId・タイトルが渡る / タイトルが空白のみで例外・保存しない

### CreateBookSchema（zod）

- **テストケース**: 最小入力（title・icon）が通る / title が空白のみ・101文字でエラー / 出版日の形式不正でエラー / currentPage が負数・小数でエラー / memo が2001文字でエラー / icon が0でエラー

## 実装時の補足

- backend-review の指摘により、zod スキーマから参照するため `CurrentPage.MIN_VALUE`（0）・`IconId.MIN_VALUE`（1）を値オブジェクトに追加した
