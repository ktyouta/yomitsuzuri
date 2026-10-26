# 気になるワード削除API（DELETE /api/v1/words/:wordId）

## 概要

ログインユーザー自身の書籍に収録された作品の気になるワードを1件、物理削除する。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 気になるワードは物理削除とし、復元の手段は設けない（「復元が必要なほど価値のあるデータには思えない」）
- `word_transaction.delete_flg` 列は残す（物理削除のため値は常に false。使わない）
- 削除は条件付きの DELETE を1回実行し、削除した件数で存在を判定する（案B。「案Bでお願い」）
- `WordEntity` の論理削除用の `delete()`・`restore()` とそのテストを削除する（決めた方針とコードを一致させるため）

### Claudeの提案（ユーザーの明示的な承認なし）

- P1: URL は定義済みの定数 `WORDS_ID`（`/api/v1/words/:wordId`）の DELETE。パスパラメータは既存の `WordIdParamSchema`
- P2: レスポンスは 200 で `{ message: "気になるワードを削除しました。" }`（data なし。データを返さない 200 の前例は update-password）
- P3: エラーは NOT_FOUND（404「気になるワードが見つかりませんでした。」。ワードが存在しない・他ユーザーの書籍のワード・ワード、作品または書籍が論理削除済みのいずれも同じ応答）
- P4: 削除の条件に `word_transaction.delete_flg = false` を含める（値は常に false だが、一覧・更新と「存在するワード」の定義をそろえるため）
- P5: 同じワードを二重に削除した場合、2回目は 404 を返す（冪等性は保証しない）
- P6: 実装範囲はバックエンドのみ（未確認の前提）

## 設計

- Repository は削除専用の `IDeleteWordRepository.deleteWord(userId, wordId): Promise<boolean>` の1メソッド
  - SQLite の DELETE は JOIN できないため、作品・書籍の条件（`book.user_id`・作品と書籍の `delete_flg = false`）は `work_id` のサブクエリで付ける
  - `.returning()` の件数が1件以上なら true（件数による判定は delete-user と同じ）
- Usecase は `WordId.of` で ID を作り、`deleteWord` が false なら `NOT_FOUND`、true なら `ok(undefined)` を返す
- 存在確認と削除を1文で行うため、確認と削除の間に書籍・作品が論理削除される競合は起きない

### 原則からの妥協

- 「親（作品・書籍）が論理削除されていたら操作できない」という条件はドメイン層ではなく SQL の条件で表す。一覧・更新と同じ扱いで、条件が3か所（get-list-word・update-word・delete-word）に重複する

### 破綻ケース

- 削除に業務上のルールが入った場合（例: 出来事に紐づいたワードは削除できない）: 「集約を読み込む → 判定 → 削除」の形に戻す必要がある
- 他のテーブルが気になるワードを参照するようになった場合: FK が `no action` のため DELETE が失敗する。子から順に削除する（`db.batch`）か、論理削除への見直しが必要になる
- 気になるワードに復元が必要になった場合: 論理削除への作り直し（`WordEntity` の `delete()`・`restore()` の再追加を含む）が必要になる
- 所有の判定ルールが変わった場合（書籍の共有など）: 3か所の条件の直し漏れが出やすい

## タスク

### バックエンド（依存順）

- [x] `WordEntity` の `delete()`・`restore()` とそのテストを削除する（前提: なし）
- [x] Repository interface `IDeleteWordRepository`（`domain/book/repository/delete-word/`）を `deleteWord(userId, wordId): Promise<boolean>` に変更し、index.ts の export 先を直す（前提: なし）
- [x] Usecase `DeleteWordUsecase` の契約テスト（`delete-word.usecase.test.ts`。update のコピーの `update-word.usecase.test.ts` を置き換える）を書き、失敗を確認する（前提: Repository interface）
- [x] Usecase `DeleteWordUsecase`（`application/book/usecase/delete-word/`）を実装し、JSDoc を削除の内容に直す（前提: 契約テスト）
- [x] Repository 実装 `DeleteWordRepository`（`infrastructure/book/repository/delete-word/`）を条件付き DELETE に変更し、index.ts の export 先を直す（前提: Repository interface）
- [x] Controller `deleteWord` の JSDoc を直し、集約ルーター `book` に登録する（前提: Usecase・Repository 実装）

### スコープ外

- フロントエンド
- 気になるワードの詳細取得 API
- コントローラーの結合テスト（「結合不要」。SQL の条件（所有者・論理削除・2回目の削除）は実際の DB では確認しない）

### 関連する他の設計書の更新

- `docs/delete-restore/plan.md` の未決事項「登場人物関係・気になるワード・出来事の削除方針」に、気になるワードは物理削除・復元なしに決めたことを反映する

## クラス仕様（契約）

### DeleteWordUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, wordId }) | wordId が空でない（Error。違反時は DB を問い合わせない） | 削除対象がない（ワードが存在しない・他ユーザーの書籍のワード・ワード、作品または書籍が論理削除済み）場合は `NOT_FOUND`（何も削除しない） / それ以外はワードを1件物理削除し、`ok(undefined)` を返す | なし |

- **テストケース**: Repository が true なら ok / `deleteWord` に userId と wordId を渡して1回呼ぶ / Repository が false なら NOT_FOUND / wordId が空で例外・`deleteWord` を呼ばない
