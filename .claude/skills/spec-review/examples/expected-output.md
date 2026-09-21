# Expected Output — Spec Review

---

## ケース1: 仕様との差分あり

### 状況
- `docs/task/plan.md` に「タスクは登録後にステータスを `active` に設定する」と書かれているが、ステータス設定の処理が未実装

### 出力

```
## 仕様突き合わせ結果

### 実装済み（仕様通り）
- タスク一覧の表示: frontend/src/features/task/components/task-list.tsx:15
- 登録後のトースト表示: frontend/src/features/task/components/task-form-container.tsx:34

### 未実装
- なし

### 仕様と異なる実装
- ステータス設定
  - 仕様: 登録後にステータスを `active` に設定する
  - 実装: backend/src/application/task/usecase/create-task.usecase.ts:22 で `setStatus()` の呼び出しがない
  - 差分の概要: ステータス設定処理が実装されていない
```

---

## ケース2: 未実装項目あり

### 状況
- `docs/notification/plan.md` に「通知詳細をモーダル表示する」と書かれているが実装されていない

### 出力

```
## 仕様突き合わせ結果

### 実装済み（仕様通り）
- 通知一覧取得: frontend/src/features/notification/api/get-notification.ts:8

### 未実装
- 通知詳細のモーダル表示: 対応するコンポーネントが確認できない

### 仕様と異なる実装
- なし
```

---

## ケース3: 仕様通り

### 出力

```
## 仕様突き合わせ結果

チェック完了。仕様通りに実装されています。
```
