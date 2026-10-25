# 気になるワード一覧取得API（GET /api/v1/works/:workId/words）

## 概要

ログインユーザー自身の書籍に収録された作品の、気になるワード一覧を返す。フロントエンドは対象外。

## 決定事項

### ユーザー決定事項

- 実装範囲は気になるワード一覧取得 API のバックエンドのみ（「気になるワード一覧取得処理を完成させて」）
- 返却項目から memo を外す（ユーザーが作業中の `WordListItem` から自身で外した）
- 並び順はページの昇順、ページ未入力（null）は末尾、同じページ内は id の昇順（ULID のため概ね登録順）

### Claudeの提案（Step 3 の設計確認でユーザーが「お願い」と承認）

- P1: URL は定義済みの定数 `WORKS_ID_WORDS`（`/api/v1/works/:workId/words`）を使う。一覧は親の下、1件は ID だけで識別する既存の shallow nesting に合う
- P2: 返却項目は id, text, page, updatedAt。登場人物一覧と同じく、一覧は概要のみとする
- P3: 作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みのいずれも 404 で同じメッセージを返す（他ユーザーの作品の存在を推測させないため。登場人物一覧と同じ）

## 設計

- Repository: `findWork(userId, workId)` で作品の取得可否を確認し、`findWordList(userId, workId)` で論理削除されていないワード一覧を返す。どちらも書籍を INNER JOIN し、所有者・論理削除の条件を共通の `buildWorkCondition` で付ける（実装済み。並び順のみ変更）
- 並び順: `page asc nulls last`, `id asc`
- Usecase: `findWork` が null なら `err({ type: "NOT_FOUND" })`、それ以外は `ok(GetListWordResultDto)`
- workId は `WorkIdParamSchema` で受け取り、Usecase が `WorkId.of` で包む

### 破綻ケース

- ページ以外の位置情報（章・%・電子書籍の位置）を持つようになった場合: ページだけでは並べられない
- ユーザーが手動で並び順を決める要件が入った場合: 並び順の列が必要になる
- 一覧画面で memo を表示する要件が入った場合: 返却項目の追加が必要
- 作品を横断して（書籍単位などで）一覧する場合: 親が変わるため別エンドポイントが必要

## タスク

### バックエンド

- [x] Repository interface `IGetListWordRepository` の並び順の JSDoc を修正
- [x] Repository 実装 `GetListWordRepository` の orderBy をページ昇順（null 末尾）・id 昇順に変更
- [x] DTO `GetListWordResultDto`（`application/book/dto/get-list-word-result/`）の JSDoc 修正とテスト
- [x] Usecase `GetListWordUsecase`（`application/book/usecase/get-list-word/`）のファイル名・JSDoc 修正と契約テスト
- [x] Controller `getListWord` を集約ルーター `book` に登録し、`presentation/book/controller/index.ts` で再エクスポート

### スコープ外

- 気になるワードの詳細取得・作成・更新・削除 API
- フロントエンド

## クラス仕様（契約）

### GetListWordUsecase（Usecase）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| execute({ userId, workId }) | workId が空でない（Error。違反時は作品・気になるワードを問い合わせない） | 作品が取得できない場合は `NOT_FOUND`。それ以外は気になるワード一覧を Repository の結果どおりに返す（0件なら空の一覧） | なし |

- **テストケース**: 一覧をそのまま返す（page が数値・null の要素を含む） / 0件なら空の一覧 / 作品が null の場合 NOT_FOUND / findWork・findWordList に userId・workId が渡る / workId が空の場合は例外・Repository 未呼び出し

### GetListWordResultDto（DTO）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| constructor(list) | なし | 各要素の id・text・page・updatedAt をそのまま list として保持する（page が null なら null） | なし |

- **テストケース**: 一覧（page が null の要素を含む）から DTO を生成できる
