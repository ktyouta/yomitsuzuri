# Performance Check 期待出力例

## ケース1: N+1 クエリ（NG）

### 状況
バックエンドの Usecase で、ID のリストに対して個別に Repository を呼び出している。

### 期待出力

```
## Performance Check 結果

### 問題あり
- **ファイル**: backend/src/application/item/usecase/get-item-list.usecase.ts:24
- **問題内容**: N+1 — `for` ループ内で `itemRepository.find(id)` を呼び出している。ID 件数分だけ DB クエリが発行される
- **修正方針**: `itemRepository.findByIds(ids)` のように一括取得メソッドを用意するか、`db.batch([])` で並列発行する
```

---

## ケース2: 逐次 await（フロントエンド）（NG）

### 状況
フロントエンドの hooks で、独立した2つの API を逐次 await している。

### 期待出力

```
## Performance Check 結果

### 問題あり
- **ファイル**: frontend/src/features/dashboard/hooks/use-dashboard-init.ts:18
- **問題内容**: 逐次 await — `await getItemList()` と `await getUserList()` が独立しているにもかかわらず逐次実行されている
- **修正方針**: `const [items, users] = await Promise.all([getItemList(), getUserList()])` に変更する
```

---

## ケース3: O(n²)（バックエンド）（NG）

### 状況
バックエンドの Usecase で、`map` の中で `find` を呼んでいる。

### 期待出力

```
## Performance Check 結果

### 問題あり
- **ファイル**: backend/src/application/list/usecase/get-list.usecase.ts:41
- **問題内容**: O(n²) — `items.map(item => users.find(u => u.ownerId === item.id))` の形でループ内 find を実行している
- **修正方針**: `users` を `Map<ownerId, user>` に変換してから `map` 内で O(1) アクセスする
```

---

## ケース4: 問題なし（OK）

### 状況
バックエンド・フロントエンドともに計算量・並列化に問題がない。

### 期待出力

```
## Performance Check 結果

チェック完了。問題なし。
```
