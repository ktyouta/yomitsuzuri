# 作品詳細取得API（GET /api/v1/works/:workId）

## 概要

ログインユーザー自身の書籍に収録された作品1件の詳細を返す。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 実装範囲は作品詳細取得 API のバックエンドのみ
- URL は既存の定数 `WORKS_ID`（`/api/v1/works/:workId`）を使う。当初は `/api/v1/books/:bookId/works/:workId` とし作品関連の6定数をネスト形式に変更したが、その根拠（URL を集約の境界から決める）が誤りだったため、ユーザー指示（正しいと言えるなら直す）により元に戻した

### Claudeの提案（ユーザーは「お願い」と実装範囲を承認。以下の項目は個別の明示的な承認なし）

- P1: URL の深さは、リソースの識別・絞り込みに必要な分だけにする（shallow nesting）。一覧は親の範囲で決まるため直接の親の下（`/books/:bookId/works`）、1件は ID（ULID）が全体で一意なため ID だけで識別する（`/works/:workId`）。既存の API 定数はこの形で一貫している
  - URL は公開する API の契約のため、DDD の集約の境界（内部の都合で変わりうる）からは決めない
- P2: 他ユーザーの書籍の作品でないことは、URL の bookId ではなく、書籍を JOIN して `user_id` で確認する
- P3: 返却項目は作業中の `WorkType` に合わせる（id, title, memo, iconId, icon（絵文字）, updatedAt）
- P4: 論理削除されたアイコンは icon を null にする（書籍詳細と同じ扱い）。iconId は作品に保存されている値をそのまま返す
- P5: 作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みのいずれも 404 で同じメッセージを返す（他ユーザーの書籍の存在を推測させないため）

## 設計

- Repository: `findWork(userId, workId)` が作品1件（なければ null）を返す。書籍を INNER JOIN し、`work_transaction.id`・`book_transaction.user_id`・両テーブルの `delete_flg = false` を条件に含める
- icon: アイコンマスタを LEFT JOIN（結合条件に `delete_flg = false`）
- Usecase: `findWork` の結果が null の場合は `err({ type: "NOT_FOUND" })`、それ以外は `ok(GetWorkResultDto)` を返す
- workId はパスパラメータを zod スキーマ `WorkIdParamSchema`（`presentation/book/schema/work-id-param/`。型のみ）で受け取り、文字列のまま Usecase に渡す。Usecase が `WorkId.of` で包む。形式が不正な ID は作品の取得で見つからないため 404 になる

### 破綻ケース

- 作品 ID を書籍ごとの採番（作品番号 1, 2… 等）に変える場合: 書籍なしでは作品を識別できないため、`/books/:bookId/works/:workId` へのネストが必要になる
- 作品詳細に書籍の情報（書籍タイトル等）も必要になった場合: 返却項目の追加が必要

## タスク

### バックエンド

- [x] Repository interface `IGetWorkRepository`（`domain/book/repository/get-work/`）の JSDoc・取得項目を作品詳細用に修正
- [x] Repository 実装 `GetWorkRepository`（`infrastructure/book/repository/get-work/`）の抽出条件・取得項目を修正
- [x] DTO `GetWorkResultDto`（`application/book/dto/get-work-result/`）を作品の項目に修正
- [x] Usecase `GetWorkUsecase`（`application/book/usecase/get-work/`）
- [x] zod スキーマ `WorkIdParamSchema`（`presentation/book/schema/work-id-param/`）
- [x] Controller `getWork` を作成し、集約ルーター `book` に登録する
- [x] index.ts の再エクスポート（application / presentation）

### スコープ外

- 他の作品関連エンドポイント（並び順・登場人物等）の実装
- フロントエンド

## クラス仕様（契約）

### GetWorkUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, workId }) | workId が空でない（Error。違反時は Repository を呼ばない）。userId の妥当性は `UserId` 型で保証する | userId・workId で作品を問い合わせる。作品が null の場合は `NOT_FOUND`。それ以外は作品を Repository の結果どおりに返す | なし |

- **テストケース**: 作品をそのまま返す / 作品が null の場合 NOT_FOUND / findWork に userId・workId が渡る / workId が空の場合は例外・findWork 未呼び出し

### その他

- DTO: 各項目がそのまま写像されること
- zod スキーマ `WorkIdParamSchema`: workId が文字列なら通る / workId がない場合はエラー
