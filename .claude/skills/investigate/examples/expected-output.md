# expected-output

## ケース1: OK — 関連ファイルを全件読んでから回答する

### 状況
「`get-item` エンドポイントでなぜ 401 が返るか調査して」と依頼された。

### 期待する出力

```
## 読み込んだファイル
- backend/src/presentation/item/controller/get-item/get-item.controller.ts
- backend/src/application/item/usecase/get-item/get-item.usecase.ts
- backend/src/infrastructure/item/repository/get-item/get-item.repository.ts
- backend/src/middleware/auth/auth.middleware.ts
- backend/src/domain/user/value-object/user-id/user-id.ts

## 調査結果

### 原因
`auth.middleware.ts:34` で JWT 検証が失敗している。
`get-item.controller.ts` はルーターに `authMiddleware` を適用しているが、
`user-id.ts` の `UserId.of()` が受け取るトークン形式と不一致が発生している。

### 詳細
...
```

---

## ケース2: NG — 起点ファイルだけ読んで回答する

### 状況
「`get-item` エンドポイントでなぜ 401 が返るか調査して」と依頼された。

### 期待しない出力（NG）

```
`get-item.controller.ts` を確認しました。
controller 自体に問題はなさそうです。
middleware の設定を確認してみてください。
```

**NG の理由**: `auth.middleware.ts` や `user-id.ts` を読まずに回答している。
読み込んだファイルの一覧も記載されていない。

---

## ケース3: OK — 機能フォルダ全体を読んでから回答する

### 状況
「item 機能のフロントエンドでどこがデータ取得を担っているか確認して」と依頼された。

### 期待する出力

```
## 読み込んだファイル
- frontend/src/features/item/components/item-page.tsx
- frontend/src/features/item/components/item-list-container.tsx
- frontend/src/features/item/hooks/use-item-list.ts
- frontend/src/features/item/api/get-item.ts
- frontend/src/lib/rpc-client.ts

## 調査結果

データ取得の流れ：
1. `item-list-container.tsx` が `use-item-list.ts` を呼び出す
2. `use-item-list.ts` が `get-item.ts` の React Query フックを使用する
3. `get-item.ts` が `rpc-client.ts` の `rpc` 経由で API を呼ぶ

...
```

---

## ケース4: NG — Glob/Grep だけで回答する（ファイルを読んでいない）

### 状況
「item 機能のフロントエンドでどこがデータ取得を担っているか確認して」と依頼された。

### 期待しない出力（NG）

```
Grep の結果、`use-item-list.ts` が該当します。
このファイルがデータ取得を担っています。
```

**NG の理由**: ファイルを Read せず Grep 結果だけで回答している。
import チェーンの全体像が把握できていない。

---

## ケース5: NG — 1回の成功だけで「動く」と回答する

### 状況
「テストに値オブジェクトのテストを追加してもいいけど、別のリポジトリでは実行できなかった」と言われた。
既存のテスト1ファイルを1回だけ実行し、通過した。

### 期待しない出力（NG）

```
このリポジトリではテストが動きました（13件すべて通過）。
別リポジトリのエラーは別の原因だったと考えられます。
```

**NG の理由**: ユーザーが「別の環境で失敗した」と不安定さを示唆しているのに、1回の成功で否定している。
環境要因の失敗（workerd の起動失敗など）は実行ごとに発生したりしなかったりするため、1回の成功では再現しないことの根拠にならない。

### 期待する出力（OK）

```
バックエンドのテストを全件、3回続けて実行しました。
- 1回目: 30ファイル・152件通過
- 2回目: 起動失敗（ConnectEx: #1225）で no tests
- 3回目: 起動失敗（ConnectEx: #1225）で no tests

不安定に失敗する状態です。別リポジトリで出たエラーも、同じ原因の可能性があります。原因を調べます。
```

---

## ケース6: NG/OK — 結論がライブラリの挙動に依存する質問

### 状況
「JSON として壊れたボディを送ったら、どんなレスポンスが返るか」と聞かれた。
JSON のパースは Hono の `validator`（`node_modules` 配下）が行っている。

### 期待しない出力（NG）

```
Hono が英語のメッセージで 400 を返すと記憶していますが、Hono のソースは確認していません。
```

**NG の理由**: 結論がライブラリの挙動に依存するのに、`node_modules` のスキップ条件に従って実装を読まず、推測のまま回答している。

### 期待する出力（OK）

```
## 読み込んだファイル
- backend/src/middleware/error-handler/error-handler.middleware.ts
- node_modules/hono/dist/validator/validator.js

## 調査結果
`validator.js` で JSON のパースに失敗すると、`HTTPException(400, { message: "Malformed JSON in request body" })` が投げられる。
`error-handler.middleware.ts` は `HTTPException` の `message` をそのまま返すため、利用者に英語のメッセージが返る。
```

---

## ケース7: NG/OK — 問題かどうかを方針で判定する

### 状況
「型が違うリクエストを送ると、zod のメッセージが返る可能性はあるか」と聞かれた。
CLAUDE.md には「外部入力が原因のものは、通常操作かリクエスト改ざんかを問わず err で扱う」「利用者向けのメッセージはプレゼンテーション層で決める」とある。

### 期待しない出力（NG）

```
返る可能性はありますが、通常の画面操作ではほぼ起きず、型や構造がおかしいリクエストのときだけです。
```

**NG の理由**: 発生頻度で問題を軽く扱っている。方針は改ざんを含む外部入力を対象にしているため、頻度に関係なく方針違反に当たる。

### 期待する出力（OK）

```
返ります。必須項目がない・型が違うリクエストでは、zod の英語のメッセージがそのまま `data` に入ります。
CLAUDE.md の方針（改ざんを問わず外部入力として扱い、文言はプレゼンテーション層で決める）に反するため、修正が必要です。
```
