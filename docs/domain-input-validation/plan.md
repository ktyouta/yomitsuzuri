# 入力値検証のドメイン移行（案C）

## 概要

外部入力の値の制約（文字数・形式・範囲など）を zod スキーマからドメイン（値オブジェクト）へ移し、制約違反を Result（err）で返す。zod スキーマは型・JSON 構造の検証のみにする。利用者向けのメッセージはプレゼンテーション層が決める。

対象は book・user・auth の全コンテキスト。コンテキストごと（さらに API ごと）に分けてコミットする。

## 決定事項

### ユーザー決定事項

- 案C（ドメインが入力値検証を担う）で進める。DDD に則る形にする
- throw / err の基準：
  - **err**: 原因が外部入力にあるもの（通常操作か、リクエスト改ざんかを問わない）
  - **throw**: 原因が自分たちのコードにあるもの（不具合・障害・自分たちの取得処理で除外済みのはずの状態）
- 値オブジェクトは private コンストラクタ + `create`（Result）の形にする。`of`（throw）は、DB 等の信頼できる値から生成する必要がある場合にのみ置く（形を揃えるためだけに置かない）
- 書籍一覧 API のページ番号: zod はクエリの文字列を数値に変換するだけにし（判定しない）、ページ番号として正しいかは `BookListPagination.create` で判定する（数値に変換できない値も `NaN` として VO で違反になる）
- 書籍一覧 API のトップの `message` も「入力エラー」にそろえる（zod のエラーフックを含む）
- エラーは値オブジェクトごとにドメインの言葉（コード）で型定義し、利用者向けメッセージはプレゼンテーション層で決める（VO にメッセージを直書きしない）
- 対象範囲は book・user・auth すべて
- ログインは「〜を入力してください」のみを返し、ユーザー名の文字数（3〜30文字）は適用しない
- コミットはコンテキストごとに分ける。最初は書籍作成 API のみで試す（実施済み・コミット済み）
- U1: メッセージ変換関数は書籍コンテキストで1つにまとめる（案B）。書籍の全 VO エラーと集約の `BookValidationError` の和を受け取る。API ごとに決まる応答（`DUPLICATE_TITLE`・`NOT_FOUND` 等）は各 Controller に残す
- U2（書籍更新 API）: トップの `message` は作成 API と同じ「入力エラー」にそろえる（zod のエラーフックを含む）
- U8: パスパラメータの `bookId` は形式（ULID）を判定しない。`BookIdParamSchema` は `z.string()` のみとし、形式が不正・存在しない書籍IDは書籍の取得で見つからないため 404 になる。空の ID はルーティングで一致せず 404 になる。`BookId` は「空でない」のみを不変条件とする
- 作品IDの空文字は新規作品（id が null）として扱う（`UpdateBookUsecase` の `!work.id` 判定）
- U10: 作品IDも形式（ULID）を判定しない（U8 の書籍IDにそろえる）。`WorkId` は「空でない」のみを不変条件とし（`create`・`WORK_ID_INVALID` は削除）、`UpdateBookUsecase` は `WorkId.of` を使う。形式が不正な作品IDは既存作品と一致せず `WORKS_MISMATCH` になる

- U6: 確認用パスワードの一致はサーバーでも判定する。置き場所は Usecase（ユースケースへの入力の約束であり、パスワードの不変条件でも型・構造の検証でもないため）。違反は `INVALID_INPUT`（`field: "confirmPassword"`、`PASSWORD_CONFIRMATION_MISMATCH`）で他の違反とまとめて返す
- パスワードの方針の文言は user と auth の変換関数で重複することを許容する（変換関数はコンテキストごとに置く）
- U9: throw / err の基準・zod の役割・メッセージの置き場所を CLAUDE.md（バックエンド固有の設計指針「入力値検証とエラーの扱い」）に明記する
- U2: トップの `message` は全 API で「入力エラー」にそろえる
- 本番データはまだないため、`UserName` に 3〜30 文字の制約を入れても既存データの確認は不要
- U3: ログインのユーザー名は `LoginName`（auth ドメイン。「空でない」のみ）を新設して判定する
- U4: 照合用のパスワード（ログイン・パスワード変更の現在のパスワード）は `RawPassword`（auth ドメイン。ハッシュ化前の平文で「空でない」のみ）を新設し、両方で使う
- `RAW_PASSWORD_EMPTY` の文言はログイン・パスワード変更とも「パスワードを入力してください」にそろえる（どの項目かは `field` で分かる）

### Claudeの提案をユーザーが承認したもの

- 書籍作成 API の試行範囲（5つの VO の private 化まで含める。変換関数・`INVALID_INPUT` 型は作成 API 内に置き、共通の置き場所は 2 つ目の利用者の移行時に決める）
- U1 の置き場所: `presentation/book/error-message/input/input.error-message.ts`（`toInputErrorMessage`）。既存の規則（`<種類>/<単位>/<単位>.<種別>.ts` + `index.ts`）に沿わせ、`presentation/book/` 配下のため単位名に `book` は付けない（2026-10-23 変更: ranking-maker に合わせ `presentation/{コンテキスト}/error-message/{コンテキスト}.error-message.ts` の1ファイル構成に変更）
- 書籍更新 API（Phase 2）:
  - 既存の `toWorkErrorMessage` も `toInputErrorMessage` へ統合する
  - 作品IDの重複・新規作品の削除済み指定は `BookValidationError` に追加し（`DUPLICATE_WORK_ID`・`NEW_WORK_DELETED`）、`INVALID_WORKS` で返す。不一致の判定（`WORKS_MISMATCH`）より前に判定する
  - 作品 0 件のリクエストは `WORKS_MISMATCH` のままにする（通常の画面操作では起こらないため、判定順は変えない）
- user（Phase 4）:
  - U5: 新しく設定するパスワードの方針（8文字以上・半角英数記号）は `NewPassword`（auth ドメイン）で判定する。ハッシュ済みの値を表す `UserPassword` は流用しない
  - U7: user・auth の Usecase は neverthrow の Result を返す
  - トップの `message` は「入力エラー」にそろえる
  - `CreateUserUsecase.execute` の引数はオブジェクト（`{ name, birthday, password, confirmPassword }`）にする
  - `UserName` の `of` は Repository が DB の値から生成するため置く。`UserBirthday`・`NewPassword` は DB の値から生成する箇所がないため `of` を置かない
  - Phase 4 の間、`LoginUsecase` は `UserName.create` が err なら DB を問い合わせずに認証失敗（401）を返す（`of` だと 2 文字以下のユーザー名で 500 になるため）。Phase 5 で `LoginName` に置き換える
- auth（Phase 5）:
  - `UserLoginEntity.verifyPassword` は `RawPassword`、`hashNewPassword` は `NewPassword` を受け取る（平文の取り違えを型で防ぐため）
  - `IUserLoginRepository.getLoginUser` は `LoginName` を受け取る
  - `LoginUsecase` は `INVALID_INPUT`（空の入力）・`AUTHENTICATION_FAILED`（ユーザーなし・パスワード不一致・プロフィールなし。応答は従来どおり 401）を返す
  - `UpdatePasswordUsecase` は `INVALID_INPUT`（現在のパスワードの空・`NewPassword` の違反・確認用パスワードの不一致）・`CURRENT_PASSWORD_MISMATCH`・`NOT_FOUND`（応答はどちらも従来どおり 401）を返す
- 追補（zod の型・構造の違反の応答。Phase 6 までの移行で zod のエラーフックが `data` に zod のメッセージを返したままだったため）:
  - zod は決まった型で受け取るためだけに使い、違反時に zod のメッセージは返さない（ユーザー指示）
  - 違反は値の制約違反と同じ形（`{ message: "入力エラー", data: [{ field, message }] }`・422）で返す。`field` は zod の path（Usecase の `field` と同じ形式）、`message` は固定
  - 全 API で同じ処理のため、`zValidator` を固定のフックで包んだ `validatorMiddleware`（`middleware/validator/`）に置く（`zValidator` 自体が Hono のミドルウェアで、ルート単位で固定の応答を返す `authMiddleware` 等と同じ位置で動くため）。使われなくなった `formatZodErrors`・`ValidationErrorType` は削除する
  - 固定のメッセージの文言「入力形式が不正です」は Claude の提案（文言自体の確認は未実施）
- 追補（Hono が投げる `HTTPException` の応答。壊れた JSON の 400 "Malformed JSON in request body"・リクエスト複製失敗の 500 の英語の開発者向けメッセージを `errorHandler` がそのまま返していたため）:
  - `errorHandler` は `HTTPException` のメッセージを返さない。ステータスは維持し、意味が確定しているステータスだけ文言を決め（400 →「入力エラー」）、それ以外は「予期しないエラーが発生しました。」にする（元のメッセージはログに残す）
  - 壊れた JSON は構文のレベルで解釈できず項目もないため、型・構造の違反（422・`data`）にはそろえず 400 のままにする
  - Hono の組み込みミドルウェア（`bodyLimit` の 413 等）を導入する場合は、対応するステータスの文言を追加する

### 未決定（次回以降に決める）

なし

## 設計

### 層ごとの責務

| 層 | 責務 | 持たないもの |
|---|---|---|
| presentation（zod） | 型・JSON 構造の検証、画面都合の項目の検証（U6）、エラーコード→メッセージ変換、レスポンス整形 | 業務ルール |
| application（Usecase） | VO 生成とエラーの収集・項目名（`field`）の付与、DB を要する判定、処理の流れ | 業務ルール、メッセージ |
| domain（VO・集約） | 業務ルールの判定、エラーのコード表現 | 画面の文言、項目名 |

### 値オブジェクト

```ts
type WorkTitleError = { type: "WORK_TITLE_EMPTY" } | { type: "WORK_TITLE_TOO_LONG"; max: number };

class WorkTitle {
  private constructor(...)
  static create(value: string): Result<WorkTitle, WorkTitleError> // 外部入力から生成。制約はここにだけ書く
  static of(value: string): WorkTitle                              // DB 等の信頼できる値から生成。違反は throw（開発者向けメッセージ）
}
```

- エラーのコード名は VO 名を接頭辞にし、全体で一意にする（プレゼンテーションで1つの switch で振り分けるため）
- `new XXX(` の呼び出しはすべて `create` / `of` に置き換える

### Usecase

1. 入力から VO を `create` で生成し、`Result.combineWithAllErrors` で違反をすべて集める。違反があれば `{ type: "INVALID_INPUT"; errors: { field, error }[] }` を返す（この時点では DB を問い合わせない）
2. DB を要する判定（存在・重複など）
3. 集約の操作（不変条件・作品の不一致）
4. 保存

- `field` は入力の項目名（`title`、`works.2.title` など。zod の `path.join(".")` と同じ形式）
- 契約の `@throws` は「コードの不具合」のみになる

### プレゼンテーション

- `INVALID_INPUT` は `{ message, data: [{ field, message }] }`（422）で返す。zod のエラーと同じ形
- メッセージ変換関数は `satisfies never` で網羅性を保証する

### 破綻ケース

- 項目の組み合わせによるルール（開始日 ≤ 終了日など）が増えた場合: VO でも集約でもない判定の置き場所が必要になる
- 同じ入力変換を複数の入口から使う場合（AI 入力補助など）: Usecase の手順1をドメインの入力変換クラスに切り出す必要がある
- DB に、新しく VO に入れる制約を満たさない既存データがある場合: Repository の `of` が throw して 500 になる（特に `UserName` の 3〜30 文字。下記「実装時の補足」参照）

## タスク

### Phase 1: 書籍作成 API（実施済み・コミット済み）

- [x] `BookTitle`・`PublishedDate`・`CurrentPage`・`BookMemo`・`IconId` に `create` / `of` / エラー型を追加し、コンストラクタを private にする（`new` の呼び出しはすべて `of` へ置換）
- [x] `CreateBookUsecase` で `INVALID_INPUT` を返す（`CreateBookInputError` は usecase ファイル内に定義）
- [x] `createBook` Controller に `toInputErrorMessage` を追加し、`message` を「入力エラー」にする
- [x] `CreateBookSchema` を型・構造のみにする
- [x] `UpdateBookSchema` は `CreateBookSchema` を流用していたため、書籍項目の制約を一時的に書き写した（Phase 2 で削除する）
- [x] テスト（VO の `create` / `of`、Usecase の `INVALID_INPUT`、スキーマの型・構造）
- [x] コミット

### Phase 2: 書籍更新 API

- [x] U1 を決める
- [x] `toInputErrorMessage` を `presentation/book/error-message/input/` へ移し、書籍の全 VO エラーと `BookValidationError` を扱う形にする（`toWorkErrorMessage` を統合）
- [x] `createBook` Controller を共通の `toInputErrorMessage` に切り替える
- [x] `ReadingStatusId`・`WorkTitle`・`WorkMemo`・`WorkSort`・`WorkId` に `create` / `of` / エラー型を追加する（`ReadingStatusId`・`WorkSort`・`WorkId` は既に private コンストラクタ + `of`）
  - 置換対象: `BookAggregate.generate`（`new WorkMemo`）、`WorkTitle.initial`（中身を `WorkTitle.of(bookTitle.value)` にする）、`UpdateBookRepository.findBook`、`UpdateBookUsecase`、テスト
- [x] `WorkId` に ULID 形式の判定を移す（現在は zod の `ULID_PATTERN` のみ）
- [x] 集約 `update` の事前条件のうち外部入力で起こせるもの（作品IDの重複・新規作品の削除済み指定）を err にする（`BookValidationError` に追加し `INVALID_WORKS` で返す）。throw に残るのは削除済み書籍の更新のみ
- [x] `UpdateBookUsecase` で `INVALID_INPUT` を返す（`works.{index}.{項目}` の field を付ける）
- [x] `UpdateBookSchema` を型・構造のみにする（Phase 1 で書き写した制約、作品の `ULID_PATTERN`・`.min(1)`・`refine` を削除。作品 0 件は集約の `WORKS_MISMATCH` になる）
- [x] `updateBook` Controller の対応（zod エラーフックの message を「入力エラー」に、`INVALID_INPUT` の追加、`toWorkErrorMessage` の削除）
- [x] テスト
- [x] コミット

### Phase 3: 書籍の取得系 API（詳細・一覧）

- [x] `BookIdParamSchema` を `z.string()` のみにする（U8。形式判定はせず、形式が不正な ID は 404 になる）
- [x] `updateBook` Controller の `BookId.of(param.bookId)` を `UpdateBookUsecase` へ移す（`GetBookUsecase` と同じく文字列で受け取る）
- [x] `BookListPagination` に `create` を追加し（`of` は使う箇所がないため置かない）、`GetListBookUsecase` を Result を返す形にする（現在は DTO を直接返す）
- [x] `GetListBookQuerySchema` は文字列→数値の変換と省略時の既定値のみにする（`z.string().default(...).transform(Number)`。判定しない）
- [x] `toInputErrorMessage` に `BOOK_LIST_PAGE_INVALID` を追加し、`getListBook` Controller で `INVALID_INPUT` を返す（zod エラーフックの message も「入力エラー」に）
- [x] テスト
- [ ] コミット

### Phase 4: user

- [x] U5〜U7 を決める
- [x] `UserName` に `create`（3〜30 文字）/ `of` を追加する（現在は zod のみ。VO は非空のみ）
- [x] `UserBirthday` に `create` を追加する（形式・実在日付は zod と VO の二重管理を解消）
- [x] `NewPassword`（auth ドメイン）を新設する
- [x] `CreateUserUsecase`・`UpdateUserUsecase` を Result にし、`INVALID_INPUT`（確認用パスワードの不一致を含む）を返す
- [x] `CreateUserSchema`・`UpdateUserSchema` を型・構造のみにする（`confirmPassword` の `refine` も削除）
- [x] `presentation/user/error-message/input/` に `toInputErrorMessage` を置き、Controller で `INVALID_INPUT` を返す（message は「入力エラー」）
- [x] `LoginUsecase`・`user-login`/`user-password` Repository の `new UserName` を置き換える
- [x] テスト
- [ ] コミット

### Phase 5: auth

- [x] U3・U4 を決める
- [x] `LoginName`・`RawPassword` を新設する
- [x] `UserLoginEntity` の `verifyPassword`・`hashNewPassword` の引数を VO にする
- [x] ログイン: `LoginUsecase` は `LoginName`・`RawPassword` を使い Result を返す。`IUserLoginRepository.getLoginUser` の引数を `LoginName` にする
- [x] パスワード変更: 新しいパスワードは `NewPassword`（Phase 4 で新設）を使い、確認用パスワードの一致を Usecase で判定し、`UpdatePasswordUsecase` で `INVALID_INPUT` を返す
- [x] `UserLoginSchema`・`UserPasswordSchema` を型・構造のみにする
- [x] `presentation/auth/error-message/input/` に `toInputErrorMessage` を置き、Controller で `INVALID_INPUT` を返す（message は「入力エラー」）
- [x] テスト（`user-login.schema.test.ts`・`user-password.controller.test.ts` を含む）
- [ ] コミット

### Phase 6: 仕上げ

- [x] U2 に従い全 API の `message` を統一する（zod のエラーフックを含む）
- [x] `docs/book-create/plan.md` の決定事項「zod スキーマは値オブジェクトと同じ制約をかけ…」が本移行で置き換わった旨を追記する
- [x] U9 に従い CLAUDE.md を更新する
- [ ] コミット

### スコープ外

- フロントエンドの変更（フロントエンドは現状 API エラーのトップの `message` のみを表示しており、`data` の項目別メッセージは表示していない）

## 実装時の補足（Phase 1 で判明した注意点）

- `Result.combineWithAllErrors([...] as const)` のように `as const` を付けると型が `never` になる。`as const` を付けずに配列リテラルを渡す（タプルとして推論される）
- 他のスキーマを流用（`omit`・`extend`・`shape`）しているスキーマは、流用元を型のみにすると制約が消える。各 Phase の着手前に `grep` で流用箇所を確認する
- `new XXX(` を `of` に置換する際は、`grep -rn "new XXX("` で全呼び出し（Repository・DTO テスト・ドメインサービステスト含む）を洗い出す
- `UserName` に 3〜30 文字の判定を入れると、Repository で DB の値から `UserName` を生成している箇所（`user-login.repository.ts`・`user-password.repository.ts` の `new UserName(row.loginId)`）が、制約を満たさない既存データで throw する。Phase 4 の前に本番・ローカルの既存データを確認する（seed にユーザーデータはない）
- RPC の型（`backend/dist-types`）は、スキーマの制約を減らしても入力の型が同じであれば変わらない。各 Phase で `npm run typecheck`（フロントエンド含む）を実行して確認する

## クラス仕様（契約）

### Phase 2（書籍更新 API）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `ReadingStatusId.create` | 事後条件 | 1以上の整数なら ok、それ以外は `READING_STATUS_ID_INVALID` |
| `WorkTitle.create` | 事後条件 | 前後の空白を除去し、空なら `WORK_TITLE_EMPTY`、上限文字数超過なら `WORK_TITLE_TOO_LONG`（`max`）、それ以外は ok |
| `WorkMemo.create` | 事後条件 | 前後の空白を除去し、空なら null として ok、上限文字数超過なら `WORK_MEMO_TOO_LONG`（`max`）、それ以外は ok |
| `WorkSort.create` | 事後条件 | `FIRST` 以上の整数なら ok、それ以外は `WORK_SORT_INVALID`（`min`） |
| `WorkId.of` | 事後条件 | 空でなければその値を保持し、空なら throw（U10 で ULID 形式の判定と `create` を削除） |
| 上記 VO の `of` | 事後条件 | `create` が ok ならその値を返し、err なら throw（呼び出し側の不具合） |
| `WorkTitle.initial` | 事前条件 | 書籍タイトルの上限文字数 ≤ 作品タイトルの上限文字数（テストで保証）。満たさない場合は `of` が throw |
| `BookAggregate.update` | 事前条件（throw） | 書籍が削除されていないこと |
| `BookAggregate.update` | err | 作品IDの重複（`DUPLICATE_WORK_ID`）・新規作品の削除済み指定（`NEW_WORK_DELETED`）があれば `INVALID_WORKS`（この場合は不一致の判定を行わない）。作品の指定が既存の作品と一致しなければ `WORKS_MISMATCH`。不変条件の違反（全件削除・タイトル重複・表示順重複）はすべて収集して `INVALID_WORKS` |
| `BookAggregate.update` | 事後条件 | ok の場合は自身の書籍情報と作品一覧を引数の内容に置き換え、新規の作品に ID を採番する。err の場合は自身を変更しない |
| `UpdateBookUsecase.execute` | 事後条件 | 入力値の制約違反はすべて `field` 付きで `INVALID_INPUT` として返し、DB は問い合わせない・保存しない。`@throws` はコードの不具合のみ |

### Phase 3（書籍一覧 API）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `BookListPagination.create` | 事後条件 | `MIN_PAGE` 以上の整数なら ok、それ以外（`NaN` を含む）は `BOOK_LIST_PAGE_INVALID`（`min`） |
| `GetListBookUsecase.execute` | 事後条件 | ページ番号が制約を満たさない場合は `field: "page"` 付きで `INVALID_INPUT` を返し、一覧・件数は問い合わせない。それ以外は指定ページの一覧・全件数・総ページ数を返す |

### Phase 4（user）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `UserName.create` | 事後条件 | 3〜30 文字なら ok。3 文字未満（空を含む）は `USER_NAME_TOO_SHORT`（`min`）、30 文字超は `USER_NAME_TOO_LONG`（`max`） |
| `UserName.of` | 事後条件 | `create` が ok ならその値、err なら throw |
| `UserBirthday.create` | 事後条件 | yyyyMMdd 形式でなければ `USER_BIRTHDAY_INVALID_FORMAT`、実在しない日付なら `USER_BIRTHDAY_NOT_EXIST`、それ以外は ok |
| `NewPassword.create` | 事後条件 | 8 文字未満なら `NEW_PASSWORD_TOO_SHORT`（`min`）、半角英数記号以外を含めば `NEW_PASSWORD_INVALID_CHARACTER`、それ以外は ok |
| `CreateUserUsecase.execute` | 事後条件 | 入力値の違反（確認用パスワードの不一致を含む）はすべて `field` 付きで `INVALID_INPUT` として返し、DB は問い合わせない・保存しない。ユーザー名が重複していれば `DUPLICATE_NAME`（保存しない）。それ以外は作成してトークンを含む DTO を返す |
| `UpdateUserUsecase.execute` | 事後条件 | 入力値の違反はすべて `INVALID_INPUT` として返し、DB は問い合わせない。重複は `DUPLICATE_NAME`、対象が存在しなければ `NOT_FOUND`。それ以外は更新して DTO を返す |
| `LoginUsecase.execute` | 事後条件 | ユーザー名が `UserName` の制約を満たさない場合は DB を問い合わせずに認証失敗（null）を返す |

### Phase 5（auth）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `LoginName.create` | 事後条件 | 空なら `LOGIN_NAME_EMPTY`、それ以外は ok |
| `RawPassword.create` | 事後条件 | 空なら `RAW_PASSWORD_EMPTY`、それ以外は ok |
| `UserLoginEntity.verifyPassword` | 事後条件 | 平文を自身のソルトとペッパーでハッシュ化し、登録済みのハッシュと一致すれば true |
| `LoginUsecase.execute` | 事後条件 | 入力値の違反はすべて `INVALID_INPUT` として返し、DB は問い合わせない。ユーザーなし・パスワード不一致・プロフィールなしは `AUTHENTICATION_FAILED`（最終ログイン日時は更新しない）。それ以外はトークンとプロフィールの DTO を返し、最終ログイン日時を更新する |
| `UpdatePasswordUsecase.execute` | 事後条件 | 入力値の違反（確認用パスワードの不一致を含む）はすべて `INVALID_INPUT` として返し、DB は問い合わせない。資格情報がない・更新対象がない場合は `NOT_FOUND`、現在のパスワードが一致しない場合は `CURRENT_PASSWORD_MISMATCH`（いずれも更新しない）。それ以外は新しいパスワードで更新する |
