# 気になるワード作成API（POST /api/v1/works/:workId/words）

## 概要

ログインユーザー自身の書籍に収録された作品に、気になるワードを1件登録する。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 実装範囲は気になるワード作成 API のバックエンドのみ（「気になるワード作成（create-word）もつくってほしい。create-characterが参考になるはず」）
- 作品内で同じワード（text）の重複を禁止する（未削除のワード同士。登場人物名と同じ扱い）

### Claudeの提案（Step 3 の設計確認でユーザーが「お願い」と承認。マイグレーションは案A）

- P1: URL は定義済みの定数 `WORKS_ID_WORDS`（`/api/v1/works/:workId/words`）の POST（一覧の GET と同じコレクション）
- P2: リクエストは `{ text: string, memo?: string | null, page?: number | null }`。zod は型・構造のみ（`nullish`）、値の制約は `WordText` / `WordMemo` / `WordPage` の `create` で判定する
- P3: レスポンスは 201 で、作成したエンティティから `{ id, workId, text, memo, page }` を返す（DB は再取得しない。登場人物作成と同じ）
- P4: エラーは INVALID_INPUT（422）・NOT_FOUND（404。作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みのいずれも同じ応答）・DUPLICATE_TEXT（409「同じワードが既に登録されています。」）
- P5: page の上限は検証しない（書籍・作品に総ページ数の列がないため。`current_page` を上限にすると先読み・読み返しの記録を拒否してしまう）
- P6: 入力エラーの文言は `book.error-message.ts` の `toInputErrorMessage` に追加する
  - `WORD_EMPTY`: ワードは必須です
  - `WORD_TOO_LONG`: ワードは{max}文字以内で入力してください
  - `WORD_MEMO_TOO_LONG`: メモは{max}文字以内で入力してください
  - `WORD_PAGE_INVALID`: ページは{min}以上の整数で入力してください
- P7: マイグレーションは生成しない（db-migration スキルの「schema.ts 変更後は db:generate を実行する」規定から外れる）。書籍関連のテーブル（`book_transaction`・`word_transaction` 等）はまだどのマイグレーションにも含まれておらず、今 `db:generate` を実行すると書籍関連のテーブルすべてを作る SQL が生成されるため（本 API の範囲を超える）

## 設計

- schema: `word_transaction` に部分ユニークインデックス `word_transaction_work_id_text_unique`（`work_id, text`、`delete_flg = 0`）を追加する（登場人物名と同じ）
- 重複判定: `WordTextUniquenessDomainService.isDuplicated(userId, workId, wordId, text)`。Repository `IWordTextUniquenessRepository.findWord` が同一ユーザーの同一作品内の未削除・同じ text・wordId 以外のワードを返す（wordId を除外するのは、更新 API でも同じ判定を使えるようにするため。登場人物名と同じ）
- Usecase の処理の流れ: 入力値の制約チェック（違反はすべて返す） → 作品の存在・所有者チェック → エンティティ生成 → 作品内の重複チェック → 保存
- workId は `WorkIdParamSchema` で受け取り、Usecase が `WorkId.of` で包む

### 破綻ケース

- 同じ言葉が出てくるたびに別の記録として残したい要件が入った場合: 一意制約と重複判定を外す必要がある。ワード（概念）と出現箇所を別テーブルに分けるモデルへの変更も候補になる
- 大文字小文字・全角半角・表記ゆれを同一視したい場合: 完全一致の判定では足りず、正規化した値の列が必要になる
- 書籍に総ページ数を持たせ、それを超えるページをエラーにする場合: Usecase で書籍の総ページ数と突き合わせる必要がある
- 同時に同じワードを登録した場合: 重複チェックをすり抜け、一意制約違反で 500 になる（登場人物作成と同じ）

## タスク

### バックエンド（依存順）

- [x] schema: `word_transaction` に部分ユニークインデックスを追加（前提: なし）
- [x] Repository interface `IWordTextUniquenessRepository`（`domain/book/repository/word-text-uniqueness/`）（前提: なし）
- [x] ドメインサービス `WordTextUniquenessDomainService`（`domain/book/service/word-text-uniqueness/`）と契約テスト（前提: 上記 interface）
- [x] Repository interface `ICreateWordRepository` の JSDoc 修正（前提: なし）
- [x] DTO `CreateWordResultDto`（`application/book/dto/create-word-result/`）とテスト（前提: なし）
- [x] Usecase `CreateWordUsecase`（`application/book/usecase/create-word/`）と契約テスト（前提: ドメインサービス・DTO・Repository interface）
- [x] Repository 実装 `CreateWordRepository`（`infrastructure/book/repository/create-word/`。中身と index.ts を登場人物から置き換え）（前提: Repository interface）
- [x] Repository 実装 `WordTextUniquenessRepository`（`infrastructure/book/repository/word-text-uniqueness/`）（前提: Repository interface）
- [x] 入力エラーの文言を `book.error-message.ts` に追加（前提: なし）
- [x] zod スキーマ `CreateWordSchema`（`presentation/book/schema/create-word/`）とテスト（前提: なし）
- [x] Controller `createWord` を作成し、集約ルーター `book` に登録する（前提: Usecase・スキーマ・Repository 実装）
- [x] index.ts の再エクスポート（各レイヤー）

### スコープ外

- 気になるワードの詳細取得・更新・削除 API
- マイグレーションの生成・適用
- フロントエンド

## クラス仕様（契約）

### CreateWordUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, workId, body }) | workId が空でない（Error。違反時は DB を問い合わせない） | 入力値の違反があればすべてを項目名付きで `INVALID_INPUT`（DB を問い合わせず保存しない） / 作品が取得できなければ `NOT_FOUND`（保存しない） / 作品内に同じ text の未削除のワードがあれば `DUPLICATE_TEXT`（保存しない） / それ以外は削除されていないワードを1件保存し、保存した内容の DTO を返す（text・memo は前後の空白を除去、空の memo・未入力の page は null） | ID の採番（`WordEntity.create`） |

- **テストケース**: 保存して内容を返す / memo・page 省略時は null で保存 / 作品が null で NOT_FOUND・保存しない / 重複ありで DUPLICATE_TEXT・保存しない / findWork・findWord に渡す値（text は前後の空白を除去した値） / 違反をすべて返し DB を問い合わせない / 違反した項目だけ返す / workId が空で例外・DB を問い合わせない

### WordTextUniquenessDomainService（ドメインサービス）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| isDuplicated(userId, workId, wordId, text) | なし | 該当するワードが1件以上なら true、0件なら false | なし |

- **テストケース**: 1件で true / 0件で false / 引数をそのまま Repository に渡す

### CreateWordResultDto（DTO）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| constructor(word) | なし | エンティティの id・workId・text・memo・page をそのまま保持する（deleteFlg は含めない） | なし |

- **テストケース**: 値ありの場合・null の場合の両方でエンティティと一致する

### CreateWordSchema（zod スキーマ）

- **テストケース**: text のみ・全項目・memo/page が null で通る / 値の制約は判定しない / text なしで通らない / 型が異なると通らない
