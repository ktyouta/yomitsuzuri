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

### Claudeの提案をユーザーが承認したもの

- 書籍作成 API の試行範囲（5つの VO の private 化まで含める。変換関数・`INVALID_INPUT` 型は作成 API 内に置き、共通の置き場所は 2 つ目の利用者の移行時に決める）
- U1 の置き場所: `presentation/book/error-message/input/input.error-message.ts`（`toInputErrorMessage`）。既存の規則（`<種類>/<単位>/<単位>.<種別>.ts` + `index.ts`）に沿わせ、`presentation/book/` 配下のため単位名に `book` は付けない
- 書籍更新 API（Phase 2）:
  - 既存の `toWorkErrorMessage` も `toInputErrorMessage` へ統合する
  - 作品IDの重複・新規作品の削除済み指定は `BookValidationError` に追加し（`DUPLICATE_WORK_ID`・`NEW_WORK_DELETED`）、`INVALID_WORKS` で返す。不一致の判定（`WORKS_MISMATCH`）より前に判定する
  - 作品 0 件のリクエストは `WORKS_MISMATCH` のままにする（通常の画面操作では起こらないため、判定順は変えない）

### 未決定（次回以降に決める）

| # | 事項 | 選択肢 / Claudeの提案 |
|---|---|---|
| U2 | トップの `message`（書籍作成・更新以外の API） | 提案: 「入力エラー」に統一（「バリデーション」は開発者向けの語のため）。書籍作成・更新 API は「入力エラー」で決定済み。全体適用は未確認 |
| U3 | ログインの非空判定の VO 名 | 提案: `LoginName`・`LoginPassword`（auth ドメイン）。いずれも「空でない」のみを判定する |
| U4 | パスワード変更の「現在のパスワード」の非空判定 | 提案: ログインと同じく「入力してください」のみ。U3 の `LoginPassword` を流用するか、別の VO にするか |
| U5 | 新しいパスワードの方針（8文字以上・半角英数記号）の VO | 提案: auth ドメインに新設（例: `PlainPassword`）。`UserPassword` はハッシュ済みの値を表すため流用しない |
| U6 | 確認用パスワードの一致判定（`confirmPassword`） | 提案: 画面の都合の項目であり業務ルールではないため zod に残す。要確認 |
| U7 | user・auth の Usecase の戻り値 | 現在は `{ status }`・`null`・`boolean` で、`INVALID_INPUT` を返せない。提案: book と同じ neverthrow の Result に揃える |
| U10 | 作品IDの形式判定 | 現在は `WorkId.create` で ULID 形式を判定している（`WORK_ID_INVALID`）。提案: U8 の書籍IDに揃えて形式判定を外し、「空でない」のみにする（形式が不正な ID は既存作品と一致せず `WORKS_MISMATCH` になるため結果は変わらない） |
| U9 | throw / err の基準・zod の役割をプロジェクトのルールとして CLAUDE.md に明記するか | 提案: 明記する |

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

- [ ] U7 を決める
- [ ] `UserName` に 3〜30 文字の判定を移す（現在は zod のみ。VO は非空のみ）
- [ ] `UserBirthday` に `create` / `of` を追加する（形式・実在日付は zod と VO の二重管理を解消）
- [ ] `CreateUserUsecase`・`UpdateUserUsecase` で `INVALID_INPUT` を返す
- [ ] `CreateUserSchema`・`UpdateUserSchema` を型・構造のみにする（`confirmPassword` は U6 次第）
- [ ] Controller の対応、テスト（`update-user.controller.test.ts` 等の既存 Controller テストを含む）

### Phase 5: auth

- [ ] U3〜U5 を決める
- [ ] ログイン: `LoginUsecase` は `new UserName(name)` をやめ、ログイン用の VO を使う。`IUserLoginRepository.getLoginUser` の引数型も変更する
- [ ] パスワード変更: 新しいパスワードの方針用の VO を新設し、`UpdatePasswordUsecase` で `INVALID_INPUT` を返す
- [ ] ユーザー登録（Phase 4）のパスワードも同じ VO を使う
- [ ] `UserLoginSchema`・`UserPasswordSchema` を型・構造のみにする
- [ ] Controller の対応、テスト（`user-password.controller.test.ts` を含む）

### Phase 6: 仕上げ

- [ ] U2 に従い全 API の `message` を統一する（zod のエラーフックを含む）
- [ ] `docs/book-create/plan.md` の決定事項「zod スキーマは値オブジェクトと同じ制約をかけ…」が本移行で置き換わった旨を追記する
- [ ] U9 に従い CLAUDE.md を更新する

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
| `WorkId.create` | 事後条件 | ULID 形式（Crockford's Base32 の26文字。I・L・O・U を含まない）なら ok、それ以外は `WORK_ID_INVALID` |
| 上記 VO の `of` | 事後条件 | `create` が ok ならその値を返し、err なら throw（呼び出し側の不具合） |
| `WorkTitle.initial` | 事前条件 | 書籍タイトルの上限文字数 ≤ 作品タイトルの上限文字数（テストで保証）。満たさない場合は `of` が throw |
| `BookAggregate.update` | 事前条件（throw） | 書籍が削除されていないこと |
| `BookAggregate.update` | err | 作品IDの重複（`DUPLICATE_WORK_ID`）・新規作品の削除済み指定（`NEW_WORK_DELETED`）があれば `INVALID_WORKS`（この場合は不一致の判定を行わない）。作品の指定が既存の作品と一致しなければ `WORKS_MISMATCH`。不変条件の違反（全件削除・タイトル重複・表示順重複）はすべて収集して `INVALID_WORKS` |
| `UpdateBookUsecase.execute` | 事後条件 | 入力値の制約違反はすべて `field` 付きで `INVALID_INPUT` として返し、DB は問い合わせない・保存しない。`@throws` はコードの不具合のみ |

### Phase 3（書籍一覧 API）

| クラス・メソッド | 契約の種類 | 内容 |
|---|---|---|
| `BookListPagination.create` | 事後条件 | `MIN_PAGE` 以上の整数なら ok、それ以外（`NaN` を含む）は `BOOK_LIST_PAGE_INVALID`（`min`） |
| `GetListBookUsecase.execute` | 事後条件 | ページ番号が制約を満たさない場合は `field: "page"` 付きで `INVALID_INPUT` を返し、一覧・件数は問い合わせない。それ以外は指定ページの一覧・全件数・総ページ数を返す |
