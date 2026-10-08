# Expected Output — Backend Review

---

## ケース1: 違反あり（Controller にビジネスロジック）

### 状況
- Controller 内で条件分岐・データ変換を直接行っている

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/presentation/item/controller/create-item/create-item.controller.ts:18
- **違反内容**: 「同名のアイテムが既に存在するか」の判定ロジックが Controller に直書きされている
- **修正方針**: 判定を Usecase の `execute` 内に移し、重複時は保存せずに `err({ type: "DUPLICATE_NAME" })` を返す。Controller はエラー種別でレスポンスを分けるだけにする
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
- **ファイル**: backend/src/application/item/usecase/create-item/create-item.usecase.ts:10
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
- **ファイル**: backend/src/presentation/user/controller/create-user/create-user.controller.ts:53
- **違反内容**: Controller が Repository を経由せず `db.batch` と Drizzle のクエリビルダーを直接呼び出している。Repository に定義済みの `insertUser` / `insertLoginUser` も使われず未使用のままになっている
- **修正方針**: `ICreateUserRepository` に `createUserWithLogin(user, login): Promise<void>` を1メソッドとして定義し、その内部で `db.batch` を完結させる。Usecase はこの1メソッドを呼ぶだけにし、Controller・Usecase から Drizzle への直接依存を除去する
```

---

## ケース5: 違反あり（ファクトリではないメソッドで決定的でない処理を使っている）

### 状況
- `TaskEntity` の `duplicate()`（タスクを複製するメソッド）の中で `ulid()` を呼び、新しいタスク ID を生成している
- `duplicate()` は ID 生成以外にタイトル等をコピーする処理を持ち、名前から ID が毎回変わることが読み取れない

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/domain/task/entity/task/task.entity.ts:42
- **違反内容**: 決定的でない処理（`ulid()`）が、名前付きファクトリメソッド（`generate()` / `create()` 等）以外のメソッド `duplicate()` の中に書かれている
- **修正方針**: ID の生成は既存の `TaskId.generate()` に任せ、`duplicate(newId: TaskId)` のように生成済みの ID を引数で受け取る。`TaskId.generate()` の呼び出しは Usecase で行う
```

---

## ケース6: 違反あり（事前条件違反で例外を投げるのに @throws がない）

### 状況
- `TaskTitle` のコンストラクタが空文字・101 文字以上で例外を投げるが、JSDoc に `@throws` が書かれていない

### 出力

```
## Backend Review 結果

### 違反あり
- **ファイル**: backend/src/domain/task/value-object/task-title/task-title.ts:12
- **違反内容**: 事前条件違反で例外を投げるコンストラクタの JSDoc に `@throws` がない
- **修正方針**: 以下のように事前条件を `@throws` で記載する
  ```ts
  /**
   * @param taskTitle タスクタイトル
   * @throws 前後の空白を除いて空の場合
   * @throws 100 文字を超える場合
   */
  ```
```

---

## ケース7: 問題なし

### 出力

```
## Backend Review 結果

チェック完了。問題なし。
```
