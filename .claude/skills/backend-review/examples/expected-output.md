# Expected Output — Backend Review

---

## ケース1: 違反あり（Controller にビジネスロジック）

### 状況
- Controller 内で条件分岐・データ変換を直接行っている

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/presentation/item/controller/create-item.controller.ts:18
- **違反内容**: 「同名のアイテムが既に存在するか」の判定ロジックが Controller に直書きされている
- **修正方針**: Usecase メソッド `findByName()` に切り出し、Controller は呼び出し結果で分岐する
```

---

## ケース2: 違反あり（Repository がエンドポイント単位でまとまっていない）

### 状況
- `get-item.repository.ts`（SELECT）と `create-item.repository.ts`（INSERT）に分かれている

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/infrastructure/item/repository/
- **違反内容**: Repository が操作種別（SELECT / INSERT）でファイル分割されている
- **修正方針**: `create-item.repository.ts` に SELECT / INSERT をまとめ、`get-item.repository.ts` は削除する
```

---

## ケース3: 違反あり（JSDoc が単行形式）

### 状況
- Usecase メソッドのコメントが `/** 説明 */` の1行形式になっている

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/application/item/usecase/create-item.usecase.ts:10
- **違反内容**: JSDoc が単行形式（`/** 説明 */`）になっている。`@param` / `@returns` を含む複数行形式が必要
- **修正方針**: 以下の形式に変更する
  ```ts
  /**
   * 説明
   * @param userId
   * @returns
   */
  ```
```

---

## ケース4: 違反あり（Controller/Usecase が db.batch を直接組み立てている）

### 状況
- ユーザー登録エンドポイントで、Controller が `db.batch([db.insert(userMaster)..., db.insert(userLoginMaster)...])` を直接呼んでいる

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/presentation/user/controller/create-user.controller.ts:53
- **違反内容**: Controller が Repository を経由せず `db.batch` と Drizzle のクエリビルダーを直接呼び出している。Repository に定義済みの `insertUser` / `insertLoginUser` も使われず未使用のままになっている
- **修正方針**: `ICreateUserRepository` に `createUserWithLogin(user, login): Promise<void>` を1メソッドとして定義し、その内部で `db.batch` を完結させる。Usecase はこの1メソッドを呼ぶだけにし、Controller・Usecase から Drizzle への直接依存を除去する
```

---

## ケース5: 問題なし

### 出力

```
## Backend Review 結果

チェック完了。問題なし。
```
