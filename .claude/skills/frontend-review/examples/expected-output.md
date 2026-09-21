# Expected Output — Frontend Review

---

## ケース1: 違反あり（Presentational に state が混入）

### 状況
- `item-list.tsx`（Presentational）内で `useState` を使っている

### 出力

```
## Frontend Review 結果

### 違反あり
- **ファイル**: frontend/src/features/item/components/item-list.tsx:6
- **違反内容**: Presentational コンポーネントに `useState` が定義されている（state は Container が持つべき）
- **修正方針**: `useState` と関連ロジックを `item-list-container.tsx` に移動し、値を props で受け取る
```

---

## ケース2: 違反あり（state 系変数にコメントなし）

### 状況
- `const [selectedItem, setSelectedItem] = useState<string | null>(null)` にコメントがない。`selectedItem` は複数箇所で参照されており、名前だけでは何の選択状態かが伝わりにくい

### 出力

```
## Frontend Review 結果

### 違反あり
- **ファイル**: frontend/src/features/item/components/item-list-container.tsx:9
- **違反内容**: `selectedItem` に変数コメントがない。複数箇所で参照されており名前だけでは役割が伝わりにくいため、comments-review の基準上コメントが必要
- **修正方針**: `// 選択中のアイテム` を前行に追加する
```

---

## ケース3: 違反あり（text-sm をボタンに使用）

### 状況
- ユーザーが能動的に操作するボタンに `text-sm` が使われている

### 出力

```
## Frontend Review 結果

### 違反あり
- **ファイル**: frontend/src/features/item/components/item-list.tsx:22
- **違反内容**: ユーザーが操作するボタンに `text-sm` を使用している（`text-base` 以上が必要）
- **修正方針**: `text-sm` → `text-base` に変更する
```

---

## ケース4: 問題なし

### 出力

```
## Frontend Review 結果

チェック完了。問題なし。
```
