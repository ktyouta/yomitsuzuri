# Expected Output — Feature Implementation

---

## ケース1: 全ステップの出力例（タスク登録機能）

### Step 3 出力（設計確認・ユーザー確認）

```
## 設計確認

### バックエンド
- エンドポイント: POST /api/tasks
- Usecase メソッド: createTask(userId, data)
- Repository メソッド: insert(userId, data, createdAt)

### フロントエンド
- コンポーネント: TaskFormContainer / TaskForm
- hooks: useTaskCreate

### 作成・変更ファイル一覧

| ファイルパス | レイヤー | 操作 |
|---|---|---|
| backend/src/presentation/task/controller/create-task.controller.ts | Controller (Presentation) | 新規 |
| backend/src/application/task/usecase/create-task.usecase.ts | Usecase (Application) | 新規 |
| backend/src/domain/task/repository/create-task.repository.interface.ts | Interface (Domain) | 新規 |
| backend/src/infrastructure/task/repository/create-task.repository.ts | Repository実装 (Infrastructure) | 新規 |
| backend/src/presentation/task/schema/create-task.schema.ts | Schema (Presentation) | 新規 |
| frontend/src/features/task/api/create-task.ts | API | 新規 |
| frontend/src/features/task/api/query-key.ts | QueryKey | 新規 |
| frontend/src/features/task/components/task-form-container.tsx | Container | 新規 |
| frontend/src/features/task/components/task-form.tsx | Presentational | 新規 |
| frontend/src/features/task/hooks/use-task-create.ts | Hook | 新規 |

### フォルダ構成チェック（CLAUDE.md 準拠）
- エンドポイント単位のファイル分割になっているか ✓
- repository に .interface.ts がセットで存在するか ✓
- Container に -container.tsx サフィックスがついているか ✓
- api/ に query-key.ts が含まれているか ✓
- components/ 配下がフラットになっているか ✓

問題がなければ実装に進みます。よろしいですか？
```

### Step 6 出力（バックエンド実装完了・ユーザー確認）

```
## バックエンド実装完了

### 変更ファイル
- backend/src/presentation/task/controller/create-task.controller.ts: POST /api/tasks エンドポイントを追加
- backend/src/application/task/usecase/create-task.usecase.ts: タスク作成ユースケースを実装
- backend/src/infrastructure/task/repository/create-task.repository.ts: INSERT 処理を実装

### 実装内容サマリー
- エンドポイント: POST /api/tasks
- Usecase メソッド: createTask(userId, data)
- Repository メソッド: insert(data)

### backend-review 結果
- 問題なし

確認できたら実装を続けます。よろしいですか？
```

---

## ケース2: レビューで NG が出た場合

### Step 8 出力（レビューで違反あり）

```
## Frontend Review 結果

### 違反あり
- **ファイル**: frontend/src/features/task/components/task-form.tsx:6
- **違反内容**: Presentational コンポーネントに `useState` が定義されている
- **修正方針**: Container に移動する

→ 修正しました。

NG 累計: 1 件 → Step 11 で skill-gap-detector を必ず実行すること
```

### Step 11 出力（NG 対応後の skill-gap-detector）

```
## Skill Gap 検出結果

### NG 内容
- Presentational コンポーネントへの state 混入が frontend-review で検出できなかった（初回）

### 原因分類
- 分類: C（skill の問題ではない）
- 理由: frontend-review のチェック項目に「Presentational コンポーネントに state 管理が含まれていないか」は記載されている。今回は実装者の確認不足。

→ skill の修正は不要です。
```
