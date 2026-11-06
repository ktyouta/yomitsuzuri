# 気になるワード削除API（DELETE /api/v1/words/:wordId）

## 概要

ログインユーザー自身の書籍に収録された作品の気になるワードを1件、論理削除する。削除方針は `docs/delete-restore/plan.md` を参照。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 削除方針（論理削除・復元）は `docs/delete-restore/plan.md` の U9 に従う

### Claudeの提案（ユーザーの明示的な承認なし）

- P1: URL は定義済みの定数 `WORDS_ID`（`/api/v1/words/:wordId`）の DELETE。パスパラメータは既存の `WordIdParamSchema`
- P2: レスポンスは 200 で `{ message: "気になるワードを削除しました。" }`（data なし。データを返さない 200 の前例は update-password）
- P3: エラーは NOT_FOUND（404「気になるワードが見つかりませんでした。」。ワードが存在しない・他ユーザーの書籍のワード・ワード、作品または書籍が論理削除済みのいずれも同じ応答）
- P4: 削除の条件に `word_transaction.delete_flg = false` を含める（一覧・更新と「存在するワード」の定義をそろえるため）
- P5: 同じワードを二重に削除した場合、2回目は 404 を返す（冪等性は保証しない）
- P6: 実装範囲はバックエンドのみ（未確認の前提）

## 設計

- 未設計。論理削除への作り直しで設計する（条件付き UPDATE にするか、`WordEntity` を読み込んで `delete()` するかは未決）

## タスク

### 論理削除への作り直し（未着手。コードはまだ物理削除）

- [ ] 設計（上記の未決事項）
- [ ] 契約テストを論理削除の事後条件に合わせて直す
- [ ] Usecase・Repository を論理削除に変更する

### 物理削除での実装（完了済み。上記の作り直しで置き換える）

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

## クラス仕様（契約）

### DeleteWordUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, wordId }) | wordId が空でない（Error。違反時は DB を問い合わせない） | 削除対象がない（ワードが存在しない・他ユーザーの書籍のワード・ワード、作品または書籍が論理削除済み）場合は `NOT_FOUND`（何も変更しない） / それ以外はワードを1件論理削除し、`ok(undefined)` を返す | なし |

- **テストケース**: 論理削除への作り直しの設計で決める
