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
