# Expected Output — DB Naming Review

---

## ケース1: 違反あり（サフィックスなし）

### 状況
- Drizzle ORM で `users` テーブルを新規定義した

### 出力

```
## DB Naming Review 結果

### 違反あり
- **テーブル名**: `users`
- **問題**: サフィックスがない（マスターデータであれば `_master` が必要）
- **修正案**: `user_master`
```

---

## ケース2: 違反あり（種別に合わないサフィックス）

### 状況
- アクセス履歴を記録するテーブルを `access_master` と命名した

### 出力

```
## DB Naming Review 結果

### 違反あり
- **テーブル名**: `access_master`
- **問題**: 履歴・イベントデータに `_master` サフィックスを使っている（`_transaction` が正しい）
- **修正案**: `access_transaction`
```

---

## ケース3: 問題なし

### 出力

```
## DB Naming Review 結果

チェック完了。命名規則に問題なし。
```
