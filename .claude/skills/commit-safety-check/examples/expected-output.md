# Expected Output — Pre-Commit Check

---

## ケース1: 要確認（機密ファイル混入）

### 状況
- `.dev.vars` が変更ファイルに含まれていた

### 出力

```
## Pre-Commit Check 結果

### 要確認
- **ファイル**: backend/.dev.vars
- **検出内容**: 機密ファイル（.dev.vars）が変更対象に含まれている
- **対応方針**: .gitignore に追加する。このファイルはコミットしない。
```

---

## ケース2: 要確認（ハードコードされた API キー）

### 状況
- ソースファイルに `sk-` で始まる文字列が追加されていた

### 出力

```
## Pre-Commit Check 結果

### 要確認
- **ファイル**: backend/src/application/item/usecase/create-item.usecase.ts:5
- **検出内容**: `sk-` で始まる文字列（API キーの可能性）がハードコードされている
- **対応方針**: 環境変数（.dev.vars）に移動し、コード上は `c.env.EXTERNAL_API_KEY` 等で参照する
```

---

## ケース3: 要確認（ローカル絶対パス混入）

### 状況
- ドキュメントファイルに `C:\Users\...` のようなローカル絶対パスが追加されていた

### 出力

```
## Pre-Commit Check 結果

### 要確認
- **ファイル**: docs/item/plan.md:12
- **検出内容**: Windows のローカル絶対パス（`C:\Users\...`）が記載されている
- **対応方針**: プロジェクトルートからの相対パスに書き換える
```

---

## ケース4: 問題なし

### 出力

```
## Pre-Commit Check 結果

チェック完了。問題なし。
```
