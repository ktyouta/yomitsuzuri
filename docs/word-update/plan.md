# 気になるワード更新API（PUT /api/v1/words/:wordId）

## 概要

ログインユーザー自身の書籍に収録された作品の気になるワードを1件更新する（ワード・メモ・ページを置き換える）。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 実装範囲は気になるワード更新 API のバックエンドのみ（「気になるワードの更新（update-word）もお願い。update-characterが参考になる認識」）
- 作品内で同じワード（text）の重複を禁止する（作成 API で決定済み。更新では自身を除外して判定する）

### Claudeの提案（Step 3 の設計確認でユーザーが「お願い」と承認）

- P1: URL は定義済みの定数 `WORDS_ID`（`/api/v1/words/:wordId`）の PUT（登場人物更新の `CHARACTERS_ID` と同じ）
- P2: パスパラメータは `WordIdParamSchema`（`presentation/book/schema/word-id-param/`。型のみ）を新規作成する。形式が不正・存在しない ID はワードの取得で見つからないため 404 になる
- P3: リクエストは作成と同じ `{ text: string, memo?: string | null, page?: number | null }` の全置き換え（省略した memo・page は null にする。登場人物更新と同じ）。スキーマは作成用と別に `UpdateWordSchema` を作る
- P4: レスポンスは 200 で、更新後のエンティティから `{ id, workId, text, memo, page }` を返す（DB は再取得しない）
- P5: エラーは INVALID_INPUT（422）・NOT_FOUND（404「気になるワードが見つかりませんでした。」。ワードが存在しない・他ユーザーの書籍のワード・ワード、作品または書籍が論理削除済みのいずれも同じ応答）・DUPLICATE_TEXT（409「同じワードが既に登録されています。」。自身は除外する）
- P6: Repository は更新専用の `IUpdateWordRepository`（`findWord(userId, wordId)` / `updateWord(word)`）。`updateWord` の WHERE は `id` と `delete_flg = false`（登場人物と同じ）
- P7: 次の既知の挙動を許容する（登場人物更新と同じ）
  - 重複チェックの後に別のリクエストが同じワードを登録した場合、一意制約違反で 500 になる（ただし書籍関連のマイグレーションが未作成のため、現時点では一意制約は DB に存在しない）
  - 取得と更新の間にワード・作品・書籍が論理削除された場合、更新されないまま 200 を返す

## 設計

- Usecase の処理の流れ: 入力値の制約チェック（違反はすべて返す） → ワードの存在・所有者チェック → 作品内の重複チェック（取得したワードの作品で、自身を除外） → `WordEntity.update` → 保存
- `findWord` は word → work → book を INNER JOIN し、3テーブルの `delete_flg = false` と `book.user_id` で絞り込み、`WordEntity.reconstruct` で返す
- 重複判定は作成 API の `WordTextUniquenessDomainService` をそのまま使う

### 破綻ケース

- 項目ごとのインライン編集など、一部の項目だけを送る要件が入った場合: 全置き換えでは省略した項目が null になるため、PATCH（部分更新）が必要になる
- 削除・復元など同じ取得条件を使う API が増えた場合: `findWord` の抽出条件が API ごとに重複し、条件の変更時に直し漏れが出やすい

## タスク

### バックエンド（依存順）

- [x] Repository interface `IUpdateWordRepository`（`domain/book/repository/update-word/`）（前提: なし）
- [x] DTO `UpdateWordResultDto`（`application/book/dto/update-word-result/`）とテスト（前提: なし）
- [x] Usecase `UpdateWordUsecase`（`application/book/usecase/update-word/`）と契約テスト（前提: Repository interface・DTO）
- [x] Repository 実装 `UpdateWordRepository`（`infrastructure/book/repository/update-word/`）（前提: Repository interface）
- [x] zod スキーマ `WordIdParamSchema`（`presentation/book/schema/word-id-param/`）とテスト（前提: なし）
- [x] zod スキーマ `UpdateWordSchema`（`presentation/book/schema/update-word/`）とテスト（前提: なし）
- [x] Controller `updateWord` を作成し、集約ルーター `book` に登録する（前提: Usecase・スキーマ・Repository 実装）
- [x] index.ts の再エクスポート（各レイヤー）

### スコープ外

- 気になるワードの詳細取得・削除・復元 API
- フロントエンド

## クラス仕様（契約）

### UpdateWordUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, wordId, body }) | wordId が空でない（Error。違反時は DB を問い合わせない） | 入力値の違反があればすべてを項目名付きで `INVALID_INPUT`（DB を問い合わせず保存しない） / ワードが取得できなければ `NOT_FOUND`（保存しない） / 作品内に自身以外の同じ text の未削除のワードがあれば `DUPLICATE_TEXT`（保存しない） / それ以外は text・memo・page を置き換えて保存し（id・作品・削除フラグは変えない）、保存した内容の DTO を返す（省略した memo・page は null） | なし |

- **テストケース**: 更新内容で保存し内容を返す / text のみで memo・page が null で保存 / findWord・重複判定に渡す値（取得したワードの作品・自身の ID・前後の空白を除去した text） / NOT_FOUND・保存しない / DUPLICATE_TEXT・保存しない / 違反をすべて返し DB を問い合わせない / 違反した項目だけ返す / wordId が空で例外・DB を問い合わせない

### UpdateWordResultDto（DTO）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| constructor(word) | なし | エンティティの id・workId・text・memo・page をそのまま保持する（deleteFlg は含めない） | なし |

- **テストケース**: 値ありの場合・null の場合の両方でエンティティと一致する

### WordIdParamSchema・UpdateWordSchema（zod スキーマ）

- **WordIdParamSchema テストケース**: 文字列なら形式を問わず通る / wordId なしで通らない
- **UpdateWordSchema テストケース**: text のみ・全項目・memo/page が null で通る / 値の制約は判定しない / text なしで通らない / 型が異なると通らない
