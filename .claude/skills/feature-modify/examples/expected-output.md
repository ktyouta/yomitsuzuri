# Expected Output — Feature Modify

---

## ケース1: バックエンド・フロントエンド両方を変更するケース

### 状況
- タスクのデフォルト優先度を「medium」から「low」に変更する

### Step 4 出力（差分設計・ユーザー確認）

```
## 差分設計

### horizontal-scope 実行結果
- horizontal-scope 実行済み、追加対象なし
  - 理由: デフォルト優先度は `create-task.usecase.ts` の定数1箇所のみで定義されており、他ファイルに同じ値のハードコードはない

### 変更内容
- [変更前]: タスク作成時のデフォルト優先度 = "medium"
- [変更後]: タスク作成時のデフォルト優先度 = "low"

### バックエンド変更点
- エンドポイント: 変更なし
- Usecase メソッド: createTask() 内の定数 `DEFAULT_PRIORITY` を "medium" → "low" に変更
- Repository メソッド: 変更なし

### フロントエンド変更点
- コンポーネント: 変更なし（表示上の変化はない）
- hooks: 変更なし

### 変更・影響ファイル一覧

| ファイルパス | レイヤー | 操作 |
|---|---|---|
| backend/src/application/task/usecase/create-task.usecase.ts | Usecase (Application) | 変更 |

### フォルダ構成チェック（CLAUDE.md 準拠）
- エンドポイント単位のファイル分割になっているか ✓
- repository に .interface.ts がセットで存在するか ✓

問題がなければ実装に進みます。よろしいですか？
```

### Step 7 出力（バックエンド変更完了）

```
## バックエンド変更完了

### 変更ファイル
- backend/src/application/task/usecase/create-task.usecase.ts: `DEFAULT_PRIORITY` を "medium" → "low" に変更

### 実装内容サマリー
- デフォルト優先度定数の値を変更（振る舞いは仕様変更の範囲）

### backend-review 結果
- 問題なし

確認できたら実装を続けます。よろしいですか？
```

---

## ケース2: UI 変更を含む改修（ui-consistency-review が先行）

### 状況
- タスクカードのデザインを変更する

### Step 0 出力（ui-consistency-review 先行実行）

```
## UI Consistency Review

### 現状の評価

#### カラーパレット
- 使用色: `bg-gray-50`, `border-gray-200`, `text-stone-700`
- 気になる点: 問題なし

...（省略）

### 修正提案
- なし

→ 上記を踏まえた上で変更を進めます。
```

その後、Step 1 の「改修内容の把握」へ進む。

---

## ケース3: schema.ts を変更するケース

### 状況
- テーブルに新規カラムを追加する

### Step 5 実装時の必須操作
1. `npm run db:generate` でマイグレーションファイルを生成
2. `npm run db:migrate:local` でローカル D1 に反映（未実行だと Step 7 の完了報告後もエラーが残る）

### Step 10 の判定
- `docs/[機能名]/spec.md` が存在しない場合は spec-review をスキップし、そのまま Step 11 へ進む

---

## ケース4: OK — horizontal-scope で他画面への対応対象を発見した

### 状況
- 依頼:「一覧画面のカードスタイルを詳細画面と揃えたい」で、対象が複数画面にまたがる

### Step 4 出力（抜粋）

```
## 差分設計

### horizontal-scope 実行結果
- 対象ファイル:
  - frontend/src/features/item/components/item-list.tsx（同じカードコンテナパターンを使用）
  - frontend/src/features/item/components/item-summary.tsx（同じカードコンテナパターンを使用）
- 他に同パターンを使う画面はなし

### 変更内容
- [変更前]: 各画面のカードが bg-white rounded-2xl border border-stone-200 ...
- [変更後]: item-detail.tsx と同じ border-[3px] border-stone-300 ... に統一
...
```

---

## ケース5: NG — horizontal-scope を実行せず Step 4 に進んだ（禁止パターン）

### 状況（悪い例）

```
## 差分設計

### 変更内容
- [変更前]: ...
- [変更後]: ...

### バックエンド変更点
...
```

### 何が問題か
- 「horizontal-scope 実行結果」欄が存在しない。この欄を省略した差分設計は Step 4 の出力として不完全であり、Step 3 が実行されていないことを意味する
- 「対応対象は今回のファイルだけのはず」という思い込みで horizontal-scope を省略すると、実は同じパターンを持つ他画面を見落とす（水平展開漏れ）リスクが残る
- 修正方針: Step 4 を書く前に必ず horizontal-scope を実行し、その結果（対象ファイル一覧、または「対応不要」とその理由）を差分設計の先頭に記載してから残りを書く
