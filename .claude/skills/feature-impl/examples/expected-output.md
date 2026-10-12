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
| backend/src/presentation/task/controller/create-task/create-task.controller.ts | Controller (Presentation) | 新規 |
| backend/src/application/task/usecase/create-task/create-task.usecase.ts | Usecase (Application) | 新規 |
| backend/src/domain/task/repository/create-task/create-task.repository.interface.ts | Interface (Domain) | 新規 |
| backend/src/infrastructure/task/repository/create-task/create-task.repository.ts | Repository実装 (Infrastructure) | 新規 |
| backend/src/presentation/task/schema/create-task/create-task.schema.ts | Schema (Presentation) | 新規 |
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

### クラス仕様（契約）

#### TaskTitle（Value Object / Domain）
- **不変条件**: value は前後の空白を除いた 1〜100 文字の文字列
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| constructor(title: string) | 前後の空白を除いて空でない（Error） / 100 文字以内（Error） | value は前後の空白を除いた値 | なし |

- **テストケース**: 正常値で生成できる / 前後の空白が除去される / 100 文字ちょうどで生成できる / 空文字・空白のみでエラー / 101 文字でエラー

#### CreateTaskUsecase（Usecase / Application）
- **不変条件**: なし
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| createTask(userId, data) | data.title が TaskTitle の事前条件を満たす（Error） | タスクを1件書き込み、作成したタスクを返す | あり（TaskId.generate） |

- **テストケース**: 正常なデータで書き込みが1回行われ作成結果が返る / タイトル不正時はエラーになり書き込みが行われない

### バックエンド設計チェック（CLAUDE.md 準拠）
- 新規・変更するドメイン層・`util/`・Usecase の契約（クラス仕様）を定義したか ✓
- ドメイン層・`util/` に副作用がないか。決定的でない処理は名前付きファクトリメソッドに閉じ込めているか ✓
- Usecase の事後条件を、業務上意味のある分岐に限定しているか ✓

問題がなければ実装に進みます。よろしいですか？
```

### Step 6 出力（バックエンド実装完了・ユーザー確認）

```
## バックエンド実装完了

### 変更ファイル
- backend/src/presentation/task/controller/create-task/create-task.controller.ts: POST /api/tasks エンドポイントを追加
- backend/src/application/task/usecase/create-task/create-task.usecase.ts: タスク作成ユースケースを実装
- backend/src/infrastructure/task/repository/create-task/create-task.repository.ts: INSERT 処理を実装

### 実装内容サマリー
- エンドポイント: POST /api/tasks
- Usecase メソッド: createTask(userId, data)
- Repository メソッド: insert(data)

### 契約テスト結果
- 契約項目: 7 件 / 対応するテスト: 7 件
- 実装前の失敗確認: 済み（7 件失敗を確認）
- 実行結果: 7 件中 7 件通過

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

---

## ケース3: NG — 契約テストを書かずに backend-review に進んだ（禁止パターン）

### 状況（悪い例）
- Step 3 で TaskTitle・CreateTaskUsecase の契約を定義した
- Step 4 で先に実装を書き、型チェックだけを行い、契約テストを作成・実行しないまま Step 5（backend-review）を実行した

### Step 6 出力（悪い例）

```
## バックエンド実装完了

### 変更ファイル
- backend/src/domain/task/value-object/task-title/task-title.ts: タスクタイトルの値オブジェクトを追加
- backend/src/application/task/usecase/create-task/create-task.usecase.ts: タスク作成ユースケースを実装

### backend-review 結果
- 問題なし

確認できたら実装を続けます。よろしいですか？
```

### 何が問題か
- 「契約テスト結果」欄が存在しない。Step 4 の【必須・ブロッキング】契約テストを先に書く（テスト駆動）が行われていないことを意味する
- 実装を先に書いている。契約テストは実装より先に書き、失敗を確認してから実装に進む
- 契約の全項目にテストがあり全件通過するまで Step 5 に進んではならない。Step 4 に戻り、契約テストを作成・実行してから backend-review をやり直す（既に実装済みの場合も、実装を一時的に外す等でテストが失敗することを確認し、テストが契約を検証できていることを確かめる）

---

## ケース4: NG — design-architect を経由せず、メイン会話で設計案を提示した（禁止パターン）

### 状況（悪い例）
- 作品詳細取得 API を、作業中の実装（未コミットの Repository・DTO）の続きとして完成させる依頼を受けた
- 作業中の実装があることを理由に Step 1 の design-architect を省略した
- `api-endpoint.const.ts` を `BOOKS` で検索しただけで、既存の `WORKS_ID` を見落とした

### Step 3 出力（悪い例）

```
## 決めていただきたいこと：URL

| 案 | メリット | デメリット |
|---|---|---|
| A. GET /api/v1/books/:bookId/works/:workId | ... | ... |
| B. GET /api/v1/works/:workId | ... | ... |

どちらにしますか？
```

### 何が問題か
- URL を新たに決める機能なのに design-architect を経由していない。作業中の実装があっても省略できない（作業中の実装は design-architect への入力として渡す）
- API 定数をキーワード検索しただけで全件 Read しておらず、既存の定義（`WORKS_ID`）を見落としている
- 推奨案を設計原則から1つに絞らず、選択肢を並べてユーザーに選ばせている
- Step 1 に戻り、design-architect を実行して推奨案と根拠を確定させてから Step 3 の確認をやり直す
