# Expected Output — Bug Fix

---

## ケース1: バックエンドのバグ修正（全ステップ）

### 状況
- タスク作成 API で「同一内容のタスクが重複 INSERT される」バグ

### Step 1 出力（原因調査）

```
## 原因調査結果

### 再現条件
- 同一リクエストを短時間に2回送信すると、2件目も INSERT される

### 原因箇所
- ファイル: backend/src/application/task/usecase/create-task.usecase.ts:18
- 原因: `checkDuplicate()` の戻り値を `undefined` チェックしているが、返却型が `null` のため常に falsy とならない

### 根本原因
- Repository の戻り値型が `null` であるのに対し、Usecase が `undefined` チェックをしているため、重複している場合も INSERT に進んでしまう
```

### Step 3〜5 中間確認

```
テスト作成完了。`npm run test` でテスト失敗を確認しました（期待通り）。
修正を適用し、テストが通過することを確認しました。
```

### Step 7 出力（レビュー）

```
## Backend Review 結果

チェック完了。問題なし。

## Architecture Review 結果

チェック完了。問題なし。

## Comments Review 結果

チェック完了。問題なし。
```

---

## ケース2: フロントエンドのバグ修正（横展開あり）

### 状況
- 一覧画面のカードで `border-gray-200` が消えているバグ

### Step 1 出力

```
## 原因調査結果

### 再現条件
- 一覧画面でアイテムカードを表示するとボーダーが見えない

### 原因箇所
- ファイル: frontend/src/features/items/components/item-card.tsx:12
- 原因: 前回のスタイル修正で `border-gray-200` がベースクラスから削除されている

### 根本原因
- クラス統合時に意図せず `border-gray-200` を削除した
```

### Step 6 出力（横展開）

```
## 水平展開漏れチェック結果

漏れなし。水平展開は完了しています。
```
