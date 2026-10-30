# 出来事詳細取得API（GET /api/v1/events/:eventId）

## 概要

ログインユーザー自身の書籍に収録された作品の出来事1件の詳細を返す。

## 決定事項

### ユーザー決定事項

- 出来事一覧 API と返却内容がほぼ同じでも、出来事詳細取得 API を作る
- workId は返さない（詳細画面へは作品の出来事一覧から遷移するため、戻り先の workId はフロントエンドの URL から取れる）

### Claudeの提案（会話で示した推奨案に対し、ユーザーが「それで実装して」と承認。P6 は会話で示しておらず未承認）

- P1: 実装範囲はバックエンドのみ（出来事一覧 API と同じ範囲という想定）
- P2: URL は既存の定数 `EVENTS_ID`（`/api/v1/events/:eventId`）を使う（ID が全体で一意なため、1件は ID だけで識別する既存の shallow nesting に沿う）
- P3: 返却項目は id, occurredTiming, content。sortOrder（並べ替えは一覧単位で行うため詳細で使わない）・updatedAt・createdAt（楽観ロック・更新日時の表示がないため）は返さない
- P4: 出来事 → 作品 → 書籍を INNER JOIN した1回の問い合わせで、`book_transaction.user_id` と3テーブルの `delete_flg = false` を条件に含める（所有者の確認と取得を分けず、所有者条件の適用漏れを構造で防ぐ）
- P5: 出来事が存在しない・他ユーザーの書籍の出来事・出来事／作品／書籍のいずれかが論理削除済みの場合は、すべて 404「出来事が見つかりませんでした。」を返す（他ユーザーの出来事の存在を推測させないため。作品・書籍が削除済みで出来事一覧から辿れないものを詳細だけ返す不整合も避ける）
- P6: Repository の返却型名は `EventDetail`（`EventEntity` との混同を避ける）。読み取り専用のため値オブジェクトは使わない

## 設計

- Repository: `findEvent(userId, eventId)` が出来事1件（なければ null）を返す
- Usecase: `EventId.of` で eventId を包み、`findEvent` の結果が null の場合は `err({ type: "NOT_FOUND" })`、それ以外は `ok(GetEventResultDto)` を返す
- eventId はパスパラメータを zod スキーマ `EventIdParamSchema`（`presentation/book/schema/event-id-param/`。型のみ）で受け取り、文字列のまま Usecase に渡す。形式が不正な ID は出来事の取得で見つからないため 404 になる

### 検討した他の案

- 出来事を取得してから所有者を別の問い合わせで確認する: 応答はどちらも 404 のため「存在しない」と「権限がない」を区別する意味がなく、問い合わせが2回になる
- 出来事の集約（EventTimelineAggregate）を読み込んで1件を取り出す: 更新用の集約を読み取りに使うことになり、作品の出来事を全件読む

### 破綻ケース

- 出来事の更新に楽観ロックを入れる場合: updatedAt の返却が必要になる
- eventId だけから作品へ戻る遷移が必要になる場合: workId の返却が必要になる
- 出来事と登場人物・手がかりを関連付ける場合: 返却内容と JOIN が増え、関連先の論理削除時の扱いを決める必要がある
- 書籍を他ユーザーと共有する場合: `book.user_id` の一致で所有者を判定する方式が成り立たない
- 出来事 ID を作品ごとの採番に変える場合: `/works/:workId/events/:eventId` へのネストが必要になる

## タスク

### バックエンド

- [x] Repository interface `IGetEventRepository`・型 `EventDetail`（`domain/book/repository/get-event/`）と index.ts の再エクスポート
- [x] DTO `GetEventResultDto`（`application/book/dto/get-event-result/`）とテスト（前提: interface）
- [x] Usecase `GetEventUsecase`（`application/book/usecase/get-event/`）の契約テスト → 実装（前提: interface・DTO）
- [x] Repository 実装 `GetEventRepository`（`infrastructure/book/repository/get-event/`）（前提: interface）
- [x] パスパラメータスキーマ `EventIdParamSchema`（`presentation/book/schema/event-id-param/`）とテスト
- [x] Controller `getEvent`（`presentation/book/controller/get-event/`。`EVENTS_ID` を使用）（前提: Usecase・Repository 実装・スキーマ）
- [x] ルーター `book.controller.ts` への登録（前提: Controller）

## クラス仕様（契約）

### GetEventUsecase（Usecase）

- **不変条件**: なし（状態を持たない）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, eventId }) | eventId が空でない（空の場合は `EventId.of` が「出来事IDが設定されていません。」を投げ、出来事を問い合わせない） | 出来事が取得できない場合は `err({ type: "NOT_FOUND" })`、取得できた場合はその内容を持つ `ok(GetEventResultDto)` | なし |

- **テストケース**: 取得した出来事をそのまま返す / 発生タイミングが null の出来事もそのまま返す / 取得できない場合は NOT_FOUND / 指定したユーザー・出来事IDで問い合わせる / 出来事IDが空なら例外になり問い合わせない

### GetEventResultDto（Application）

- **不変条件**: value は生成後に変わらない

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| constructor(event) | なし | value は id・occurredTiming・content を入力のまま保持する（null は null のまま） | なし |

- **テストケース**: 出来事から DTO を生成できる / 発生タイミングが null の場合は null のまま返す

### EventIdParamSchema（Presentation）

- **不変条件**: 型のみを検証する（値の制約は書かない）
- **テストケース**: eventId が文字列（ULID 形式・不正な形式）ならそのまま通る / eventId がない場合はエラーになる
