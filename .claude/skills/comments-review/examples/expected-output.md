# Expected Output — Comments Review

---

## ケース1: 違反あり（WHAT コメント）

### 状況
- バックエンドの Usecase に「アイテムを取得する」というコメントが書かれている

### 出力

```
## Comments Review 結果

### 違反あり
- **ファイル**: backend/src/application/item/usecase/get-item.usecase.ts:12
- **違反内容**: `// アイテムを取得する` — 関数名 `getItem` から明らかに読み取れる WHAT コメント
- **修正方針**: 削除する（関数名で十分に意味が伝わる）
```

---

## ケース2: 違反あり（実装詳細コメント）

### 状況
- フロントエンドの useState に「API からフェッチしたアイテム一覧」と書かれている

### 出力

```
## Comments Review 結果

### 違反あり
- **ファイル**: frontend/src/features/item/components/item-list.tsx:8
- **違反内容**: `// API からフェッチしたアイテム一覧` — 「どこから取得するか」という実装詳細を含む
- **修正方針**: `// アイテム一覧` に短縮する（WHAT の説明のみ残す）
```

---

## ケース3: 問題なし

### 状況
- コメントが WHY（なぜそうするか）に限定されている

### 出力

```
## Comments Review 結果

チェック完了。問題なし。
```
