# demo-seed 期待出力例

## ケース1: フルリセット（最も多いケース）

**ユーザー発話**
```
デモデータをリセットして
```

**期待動作**

1. コマンド判定 → `db:demo:reset:local`
2. 確認メッセージ出力：
   ```
   デモデータを削除して再投入します（db:demo:reset:local）。よろしいですか？
   ```
3. ユーザー承認後、実行：
   ```bash
   cd backend && npm run db:demo:reset:local
   ```
4. 結果報告：
   ```
   デモデータのリセットが完了しました。
   ```

---

## ケース2: 投入のみ

**ユーザー発話**
```
シードを流して
```

**期待動作**

1. コマンド判定 → `db:demo:local`
2. 確認なしで即実行：
   ```bash
   cd backend && npm run db:demo:local
   ```
3. 結果報告：
   ```
   デモシードの投入が完了しました。
   ```

---

## ケース3: 削除のみ

**ユーザー発話**
```
デモデータを削除して
```

**期待動作**

1. コマンド判定 → `db:demo:delete:local`
2. 確認メッセージ出力：
   ```
   シードレコードを削除します（db:demo:delete:local）。よろしいですか？
   ```
3. ユーザー承認後、実行：
   ```bash
   cd backend && npm run db:demo:delete:local
   ```
4. 結果報告：
   ```
   シードレコードの削除が完了しました。
   ```

---

## ケース4: SQL 生成のみ

**ユーザー発話**
```
demo-seed.sql を作り直して
```

**期待動作**

1. コマンド判定 → `db:demo:generate`
2. 確認なしで即実行：
   ```bash
   cd backend && npm run db:demo:generate
   ```
3. 結果報告：
   ```
   demo-seed.sql と delete-seed.sql を生成しました。
   ```
