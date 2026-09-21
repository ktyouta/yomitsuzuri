# Expected Output — UI Consistency Review

---

## ケース1: 複数の不一致を検出

### 状況
- 機能ページのコンポーネント改修前に実行
- `components/` 配下に `action-list.tsx` / `stat-card.tsx` / `info-panel.tsx` がある

### 出力

```
## UI Consistency Review

### 現状の評価

#### カラーパレット
- 使用色:
  - テキスト: `text-stone-700`, `text-gray-500`, `text-blue-500`
  - 背景: `bg-blue-50`, `bg-white`
  - ボーダー: `border-blue-200`, `border-stone-200`
  - アクセント: `text-blue-400`
- 気になる点: テキストカラーに `text-stone-700` と `text-gray-500` が混在している。補助テキストの役割に対して2種類の色が使われており、統一が必要。

#### スペーシングリズム
- 使用余白: `mb-4`, `mb-6`, `gap-2`, `gap-3`, `px-4`, `py-3`, `p-4`
- 気になる点: カード間の `mb-` が `mb-4` と `mb-6` で混在。視覚的なリズムが不規則になっている。

#### タイポグラフィ階層
- 使用スタイル: `text-xl font-bold`, `text-base`, `text-sm`
- 気になる点: `info-panel.tsx` の説明テキストに `text-sm` が使われているが、ユーザーが能動的に読む内容のため `text-base` が適切。

#### 視覚的重みのバランス
- 気になる点: `stat-card.tsx` の数値が `text-xl` で、アクションリストの見出しと同じサイズになっている。どちらが主役か階層が不明確。

#### 情報設計
- 気になる点: `stat-card.tsx` が件数を `件数: 128` という生データのまま表示している。ユーザーが直感的に増減を把握できるよう加工されていない。

#### インタラクション
- 気になる点: `action-list.tsx` は `hover:opacity-80`、`stat-card.tsx` は `hover:bg-blue-100` と表現が統一されていない。

### 修正提案（優先度順）

1. 補助テキストのカラーを `text-stone-500` に統一する（`text-gray-500` → `text-stone-500`）
2. カード間余白を `mb-4` に統一する（`mb-6` → `mb-4`）
3. `info-panel.tsx` の説明テキストを `text-sm` → `text-base` に変更する
4. `stat-card.tsx` の件数表示に前回比の増減（例: 「128件（+12）」）を添え、変化が一目で伝わるようにする

→ 上記を踏まえた上で変更を進めます。
```

---

## ケース2: 問題なし

### 出力

```
## UI Consistency Review

### 現状の評価

#### カラーパレット
- 使用色: `text-stone-700`, `text-stone-500`, `bg-gray-50`, `border-gray-200`
- 気になる点: 問題なし

#### スペーシングリズム
- 使用余白: `mb-4`, `gap-2`, `px-4`, `py-3`
- 気になる点: 問題なし

#### タイポグラフィ階層
- 使用スタイル: `text-2xl font-bold`, `text-base`, `text-sm`（副次アクションのみ）
- 気になる点: 問題なし

#### 視覚的重みのバランス
- 気になる点: 問題なし

#### 情報設計
- 気になる点: 問題なし

#### インタラクション
- 気になる点: 問題なし

### 修正提案
- なし

→ 上記を踏まえた上で変更を進めます。
```
