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
  - 実装: backend/src/application/task/usecase/create-task/create-task.usecase.ts:22 で `setStatus()` の呼び出しがない
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

### 状況
- `docs/task/plan.md` に TaskTitle のクラス仕様（契約）が記載されており、全項目が実装・テスト済み

### 出力

```
## 仕様突き合わせ結果

チェック完了。仕様通りに実装されています。

### 契約とテストの対応
| クラス・メソッド | 契約項目 | 実装 | テスト | 判定 |
|---|---|---|---|---|
| TaskTitle.constructor | 事前条件: 空でない | task-title.ts:15 | task-title.test.ts「空文字でエラーになること」 | ✓ |
| TaskTitle.constructor | 事前条件: 100 文字以内 | task-title.ts:19 | task-title.test.ts「上限文字数を超えるとエラーになること」 | ✓ |
| TaskTitle.constructor | 事後条件: value は前後の空白を除いた値 | task-title.ts:23 | task-title.test.ts「前後の空白を除去して保持すること」 | ✓ |
```

---

## ケース4: 契約項目に対応するテストがない（未カバーあり）

### 状況
- `docs/task/plan.md` の CreateTaskUsecase の契約に「タイトル不正時はエラーになり書き込みが行われない」とあるが、書き込みが行われないことを検証するテストがない
- 既存のテストファイル `create-task.usecase.test.ts` は存在するが、正常系のみを検証している

### 出力

```
## 仕様突き合わせ結果

### 実装済み（仕様通り）
- タスク作成ユースケース: backend/src/application/task/usecase/create-task/create-task.usecase.ts:18

### 未実装
- CreateTaskUsecase.createTask の事後条件「タイトル不正時は書き込みが行われない」: 対応するテストが確認できない（未カバー）

### 仕様と異なる実装
- なし

### 契約とテストの対応
| クラス・メソッド | 契約項目 | 実装 | テスト | 判定 |
|---|---|---|---|---|
| CreateTaskUsecase.createTask | 事後条件: タスクを1件書き込み、作成結果を返す | create-task.usecase.ts:25 | create-task.usecase.test.ts「正常なデータで書き込みが1回行われること」 | ✓ |
| CreateTaskUsecase.createTask | 事後条件: タイトル不正時はエラーになり書き込みが行われない | create-task.usecase.ts:20 | なし（テストファイルは存在するが該当する検証がない） | 未カバー |
```
