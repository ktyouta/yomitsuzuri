# Expected Output — Refactor

---

## ケース1: リファクタリング成功

### 状況
- `create-item.usecase.ts` の複数責務を分割してほしいというリファクタ依頼

### Step 1 出力（目的確認）

```
## リファクタリング目的
- 対象: backend/src/application/item/usecase/create-item/create-item.usecase.ts
- 現在の問題: `execute()` の中に重複チェックの条件組み立てと後処理の計算が直書きされ、処理の流れが読みにくい
- 改善後の期待状態: 計算をドメイン層に移し、重複チェックをドメインサービスに切り出して、`execute()` の流れを上から読めるようにする（public メソッドは `execute` 1つのまま）
- 振る舞いへの影響: なし（振る舞いを変えないことを確認）
- 契約への影響: なし（事前条件・事後条件・不変条件を変えないことを確認）
```

### Step 3 出力（リファクタ前テスト）

```
テスト実行: npm run test --prefix backend -- --run
結果: 全テスト通過（12/12）
→ リファクタリングを開始します
```

### Step 5 出力（リファクタ後テスト）

```
テスト実行: npm run test --prefix backend -- --run
結果: 全テスト通過（12/12）
→ 振る舞いが保たれていることを確認しました
```

### Step 6 出力（レビュー）

```
## Backend Review 結果

チェック完了。問題なし。

## Architecture Review 結果

チェック完了。問題なし。

## Comments Review 結果

チェック完了。問題なし。
```

---

## ケース2: テストが落ちたため中断

### 状況
- リファクタリング後にテストが失敗した

### Step 5 出力

```
テスト実行: npm run test --prefix backend -- --run
結果: 2件失敗
  - create-item: 重複登録の場合に 409 を返すべきだが 200 が返る
  - create-item: 後処理が2回行われている

→ テストが落ちているため、振る舞いが変わっている可能性があります。
  リファクタリングを見直します。
```

---

## ケース3: ファイル移動のみで一部レビューをスキップ

### 状況
- テストファイルを実装ファイルと同じ単位フォルダに移動した
- 差分はファイルの移動と相対 import パスの変更（13 行）のみ

### Step 6 出力（レビュー）

```
## Architecture Review 結果

チェック完了。問題なし。

## comments-review / performance-check
差分がファイルの移動と相対 import パスの変更のみのため、スキップしました。
```
