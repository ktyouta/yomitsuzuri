# 気になるワード削除API（DELETE /api/v1/words/:wordId）

## 概要

ログインユーザー自身の書籍に収録された作品の気になるワードを1件、論理削除する。削除方針は `docs/delete-restore/plan.md` を参照。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 削除方針（論理削除・復元）は `docs/delete-restore/plan.md` の U9 に従う
- 論理削除は、`WordEntity` を読み込んで `delete()` を呼び、保存する形にする（2026-11-06。出来事・登場人物関係の削除も同じ形）
- 今回は論理削除への切り替えのみ。一覧での薄い表示・復元・完全削除は対象外（2026-11-06）

### Claude の提案（ユーザーが差分設計を承認。2026-11-06）

- 復元 API がないため、`WordEntity` に `restore()` は追加しない
- 取得の条件は更新 API の `findWord` と同じ。登場人物関係の削除では、人物・相手の削除状態を確認しない（`docs/character-relation/plan.md` の U10 を保つため）
- 取得してから保存するまでの間に書籍・作品が論理削除された場合は、そのまま削除する（更新 API と同じ扱い）

### Claudeの提案（ユーザーの明示的な承認なし）

- P1: URL は定義済みの定数 `WORDS_ID`（`/api/v1/words/:wordId`）の DELETE。パスパラメータは既存の `WordIdParamSchema`
- P2: レスポンスは 200 で `{ message: "気になるワードを削除しました。" }`（data なし。データを返さない 200 の前例は update-password）
- P3: エラーは NOT_FOUND（404「気になるワードが見つかりませんでした。」。ワードが存在しない・他ユーザーの書籍のワード・ワード、作品または書籍が論理削除済みのいずれも同じ応答）
- P4: 削除の条件に `word_transaction.delete_flg = false` を含める（一覧・更新と「存在するワード」の定義をそろえるため）
- P5: 同じワードを二重に削除した場合、2回目は 404 を返す（冪等性は保証しない）
- P6: 実装範囲はバックエンドのみ（未確認の前提）

## 設計

- Repository は `IDeleteWordRepository` の2メソッド
  - `findWord(userId, wordId): Promise<WordEntity | null>`（更新 API の `findWord` と同じ条件）
  - `deleteWord(word: WordEntity): Promise<void>`（`delete_flg`・`updated_at` を UPDATE する。条件は ID と `delete_flg = false`）
- Usecase は `WordId.of` で ID を作り、`findWord` が null なら `NOT_FOUND`。それ以外は `word.delete()` の後に `deleteWord` で保存し、`ok(undefined)` を返す
- 出来事（`DeleteEventUsecase`）・登場人物関係（`DeleteCharacterRelationUsecase`）も同じ形にする

## タスク

### 論理削除への作り直し（ワード・出来事・登場人物関係）

- [x] Entity（`WordEntity`・`EventEntity`・`CharacterRelationEntity`）の `delete()` の契約テストを書き、失敗を確認する
- [x] Entity に `delete()` を追加する
- [x] Usecase（`DeleteWordUsecase`・`DeleteEventUsecase`・`DeleteCharacterRelationUsecase`）の契約テストを論理削除に合わせて直し、失敗を確認する
- [x] Repository interface を `find*`・`delete*(entity)` の2メソッドに変更する
- [x] Usecase を変更する
- [x] Repository 実装を、取得と UPDATE に変更する（Repository のテストがないため、実際の DB では未確認）
- [ ] コミット

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

- **テストケース**: `findWord` が null なら NOT_FOUND・`deleteWord` を呼ばない / 取得できたら削除済みにしたワードで `deleteWord` を1回呼び、ok を返す / wordId が空で例外・`findWord` を呼ばない
- `DeleteEventUsecase`・`DeleteCharacterRelationUsecase` も同じ契約（対象と ID の名前だけが異なる）

### WordEntity・EventEntity・CharacterRelationEntity（Entity）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| delete() | 削除されていない（Error） | 自身を削除済みにする。他の値は変えない | なし |

- **テストケース**: 削除済みになる / 他の値が変わらない（スナップショット全体で比べる） / 削除済みに対して呼ぶと例外
