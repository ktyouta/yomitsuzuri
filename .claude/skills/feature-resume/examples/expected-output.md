# Expected Output — Feature Resume

---

## ケース1: バックエンド完了・フロントエンド未着手

### 状況
- `docs/task/plan.md` が存在する
- バックエンドのコミットはある
- フロントエンドのコミットはない

### 出力

```
## 作業再開レポート

### 実装中の機能
- タスク登録機能: docs/task/plan.md より

### 完了済みステップ
- Step 1: 設計分解（feature-breakdown 実行済み）
- Step 2: 設計書出力（docs/task/plan.md 作成済み）
- Step 3: ユーザー確認（設計・ファイル構成）
- Step 4: バックエンド実装
- Step 5: backend-review 実行
- Step 6: ユーザー確認（バックエンド）

### 再開ポイント
- feature-impl の Step 7（フロントエンド実装）から再開してください
- 理由: `git log` でバックエンドのコミット（"Add task API endpoint"）を確認。フロントエンド関連のコミットはなし。

### 未コミットの変更
- なし
```

---

## ケース2: フロントエンド途中で止まっている

### 状況
- バックエンド・フロントエンドの一部はコミット済み
- `git status` に未コミットの変更がある

### 出力

```
## 作業再開レポート

### 実装中の機能
- タスク登録機能: docs/task/plan.md より

### 完了済みステップ
- Step 1〜7: 完了（コミット履歴より確認）
- Step 8: レビュー実行 — 未実施の可能性あり（未コミット変更があるため要確認）

### 再開ポイント
- feature-impl の Step 8（レビュー実行）から再開してください
- 理由: `git status` に `frontend/src/features/task/components/task-form.tsx` が未コミットとして残っている。フロントエンド実装は途中と判断。

### 未コミットの変更
- frontend/src/features/task/components/task-form.tsx（変更中）
- frontend/src/features/task/components/task-form-container.tsx（変更中）
```
