---
name: backend-review
description: |
  バックエンドのコード変更が完了した直後に、レイヤー設計・単一責務の観点でチェックを行う。

  以下のような場合に必ず呼び出す：
  - バックエンドの Controller / Usecase / Repository / Domain を新規作成・修正したとき
  feature-impl / feature-modify / bug-fix / refactor を経由しない実装（plan.md ベースの手動実装等）でも、上記の条件を満たす変更を行った場合は必ず実行すること。

  以下の場合は使用しない：
  - フロントエンドのみの変更
  - 調査・説明・設計相談のみの場合
version: 2.1.0
---

# Backend Review Skill

## Overview

バックエンド実装後に、レイヤー設計（Presentation/Application/Domain/Infrastructure の4層DDD構成）・単一責務の違反パターンをチェックする。

**呼び出し条件（必須）**
- バックエンドの Controller / Usecase / Repository / Domain を新規作成・修正したとき
- feature-impl / feature-modify / bug-fix / refactor を経由しない手動実装でも、上記条件を満たす変更を行った場合は必ず実行すること

**対象外**
- フロントエンドのみの変更
- 調査・説明・設計相談のみの場合

---

## Check Instructions

### Controller 単一責務（Presentation層）
- Controller 内にビジネスロジック・VO生成・DBアクセスが直書きされていないか
- Controller は Zodバリデーション・Usecase呼び出し・Usecase が返す DTO の `value` からレスポンス／Cookie 用の値の取り出し・ステータスコード決定のみを行っているか
  - DTO は `application/{機能グループ名}/dto/` に定義し、Usecase が生成して返す。Controller で DTO を `new` していたら Usecase への漏れとして指摘する
- Controller が Repository・Drizzle・domain の Entity/VO 生成ロジックに直接触れていないか（触れる場合は Usecase への漏れとして指摘する）
- 処理の流れが上から順に読めるか（コメントや命名で各ステップの概要が把握できるか）
- Usecase 呼び出しの順序でエンドポイントの処理概要が理解できるか

### Usecase メソッド設計（Application層）
- Controller から呼ばれる処理単位でメソッドに切り出されているか
- DB に触れない純粋なビジネスロジック（バリデーション・計算処理等）もメソッドとして定義されているか
- Repository を直接呼ぶだけのメソッドであっても、名前付きメソッドとして切り出されているか
- Controller が単一の `usecase.xxx()` 呼び出しで完結していないか確認する
  - アンチパターン: `usecase.checkout()` 1つがデータ取得・エンティティ構築・分岐・DB操作をすべて担っている
  - 正しいパターン: `getCurrentState` / `insert` / `update` に分割し、Controller の呼び出し順でフローが読める
- ロジックを含まない処理が Usecase メソッドになっていないか
  - ロジックの例（例示であって網羅ではない）: 条件分岐・ループ・計算・DB アクセス
  - アンチパターン: `usecase.buildEntity()` のような、内部で単に `new Entity(...)` するだけのメソッドを Usecase に定義している
  - 正しいパターン: Controller で直接 `new SomeEntity(...)` する（ロジックを含まない単純な構築・変換は Controller で直接行う）
- Usecase が Drizzle のクエリビルダー（`db.insert(...)` 等）やテーブルスキーマを直接importしていないか（Infrastructure層の詳細はRepository経由でのみ扱う）
- **モジュール跨ぎの依存は許可される**: Usecase が自モジュール以外の `domain/{他モジュール}/repository` interface に依存すること自体は違反ではない（例: `application/user/usecase/create-user/create-user.usecase.ts` が `domain/auth` の `IUserLoginRepository` に依存する）。ただし domain 層の Entity/VO 同士が直接依存するのは違反として指摘する

### フォルダ・ファイル構成
- `domain/{機能グループ名}/`（entity, value-object, repository interface）、`application/{機能グループ名}/`（usecase, dto）、`infrastructure/{機能グループ名}/repository/`、`presentation/{機能グループ名}/`（controller, schema）の4層構成に沿っているか
- 各レイヤーのファイルが `[操作名]/[操作名].[レイヤー].ts` の命名でエンドポイント単位に分割されているか（1単位1フォルダ。テストも同じフォルダに置く）
- ルーター集約ファイルが `[機能グループ名]/[機能グループ名].controller.ts` になっているか
- repository に対応する `.repository.interface.ts` が `domain/` 側にセットで存在するか
- 各レイヤーフォルダ・単位フォルダに `index.ts` が存在するか
- 複数のドメインで共有する VO（`UserId` / `UserName` 等）が `domain/shared/` に置かれ、ドメイン同士が直接 import していないか

### コーディング規約
- ユーティリティ関数（日付変換・文字列変換等）を Usecase / Controller 内に直接定義していないか
  - 実装前に `src/util/` 配下の既存関数と重複がないか確認すること
  - 複数ファイルで同じ関数が定義されている場合は `src/util/` に集約する
- `if` 文が1行でも中括弧 `{ }` を省略していないか。また処理が1行でも `{ return; }` のように同一行に収めず、改行して記述されているか
- non-null アサーション（`!`）を使っていないか
  - アンチパターン: `const user = c.get("user")!;` / `const entry = map.get(key)!;` など `.get()` 系メソッド全般
  - 正しいパターン: `const user = c.get("user"); if (!user) { return c.json(...); }` / `const entry = map.get(key); if (!entry) { continue; }` のように明示的ガード節で処理する
- メソッド名にパラメータ情報（`ById`・`ByName` 等）が含まれていないか（複数パラメータで識別が必要な場合は除く）
- クラス・メソッドに `@param` / `@returns` を含む複数行 JSDoc 形式のコメントがあるか（単行 `/** 説明 */` は不可）
- コントローラーのセクション区切りコメントに実装詳細が含まれていないか（「どこから取得するか」等の記述がないか）
- マジックナンバーが直接記述されていないか（名前付き定数に切り出すこと。定数値は意図が読み取れる形で書く）
- `c.json({ message, data })` の `message` が `"OK"` のままになっていないか（ヘルスチェックを除く業務エンドポイントはエンドポイントごとの日本語メッセージを返すこと）
- `domain/` に対応する値オブジェクトが存在する場合、raw union 型や `string` 型を直接使っていないか
  - メソッドコードだけでなく、**新規定義した params 型・record 型のフィールド**も対象に含める（例: `itemId: string` ではなく `ItemId` 型を使う）
- 既存のドメイン型をその型が表す意味と異なる概念に流用していないか（例: あるドメイン型の `generate()` を、その型とは無関係な概念の ID・値の生成に使用する）
- 構造（フィールド名・型）が同じというだけで、意味の異なる複数のドメイン概念に同じ型を共有させていないか
  - 判定基準: 同じ型を使う複数の生成元で、各フィールドが指し示す意味が食い違う場合は別概念とみなす
    （例: `field` が一方では「フォーム経路を示す論理パス」、他方では「人間向け表示ラベル」を意味する）
  - アンチパターン: スキーマ検証の違反を表す `Violation`（`field` は論理パス）を、AI/外部サービスによる判定結果にもそのまま流用する
  - 正しいパターン: 構造が同じでも概念が異なるなら、そのドメイン概念専用の型を別途定義する
- `string` 型を使っているフィールドのうち、対応するドメイン型を新規作成すべきものが残っていないか
- VOのクラス名・フォルダ名のプレフィックスが、同一 `domain/{機能}/value-object/` 配下で概念が衝突する場合にのみ付いているか
  - プレフィックスが必要: 同じ属性を複数の概念が持ち区別が必要なもの（例: `domain/book/` で書籍と作品がともにタイトルを持つ → `BookTitle` / `WorkTitle`）
  - プレフィックスが不要: 衝突しない属性（例: 書籍のみが持つ出版日 → `PublishedDate`。`BookPublishedDate` としない）
  - 新規VOの追加で既存VOと衝突が生じる場合は、既存VO側にもプレフィックスを付けて区別する
- VOに複数の生成意味（値検証によるインスタンス化 vs デフォルト値生成 等）がある場合、`private constructor` + 名前付き静的ファクトリメソッド（`of` / `default` 等）に分離しているか
  - アンチパターン: `public constructor` のみを持つVOに対し、デフォルト値生成のために `new Theme(Theme.LAVENDER)` のような自己参照的な呼び出しをコール側に書かせている
  - 正しいパターン: `UserId` の `static generate()`（新規生成）/ `static of()`（既存値から復元）のように、生成意味ごとに名前付きファクトリメソッドを分離する（例: `static of(value)` / `static default()`）

### 契約・純粋性（ドメイン層・util・Usecase）
CLAUDE.md の「クラス設計指針（契約による設計）」に基づき確認する。

**ドメイン層（Entity・Value Object）・`util/`**
- 副作用（DB・外部 API 等の I/O、`console` 出力、引数や外部変数の書き換え）がないか
- 決定的でない処理（`Date.now()`・引数なしの `new Date()`・`Math.random()`・`crypto.getRandomValues()`・`ulid()` 等）が、不可避なものに限り、新しいインスタンスを返す名前付きファクトリメソッド（`generate()` / `create()` / `refresh()` 等）に閉じ込められているか
  - 外部ライブラリが内部で時刻等を参照するもの（例: JWT の有効期限検証）は、JSDoc にその旨が記載されていれば許可する
  - 判定・取得メソッド等で決定的でない処理を使う場合、そのメソッドの JSDoc に理由（例: 将来の拡張に備えて現状の構造を維持している等）が明記されていれば違反とせず、理由が妥当かを確認する。理由の記載がなければ違反とする
- 不変条件をコンストラクタで検証し、不変条件を満たさないインスタンスを生成できないようになっているか
- フィールドが `readonly` で setter がなく、メソッドが自身の状態を書き換えず新しいインスタンスを返しているか
- 事前条件違反で例外を投げるコンストラクタ・メソッドの JSDoc に `@throws` があるか
- private ヘルパーメソッドの書き方（`static` かインスタンスメソッドか）が、同じ役割を持つ既存の Value Object（例: `UserBirthday` の `checkFormat` / `checkDateValid`）と揃っているか

**Usecase**
- public メソッドの JSDoc に、業務上意味のある分岐ごとの事後条件（`@returns` に分岐ごとの戻り値、書き込みを行わない条件等）が記載されているか
- 事後条件に Repository の呼び出し順など実装の手順を含めていないか

**Presentation 層の Zod スキーマ**
- 値オブジェクトと同じ制約（文字数上限等）を設ける場合、数値を直書きせず値オブジェクトの定数（例: `BookTitle.TITLE_MAX_LENGTH`）を参照しているか
  - アンチパターン: `z.string().max(100)`（`BookTitle` の上限と別々に管理され、片方だけ変更すると食い違う）
  - 正しいパターン: `z.string().max(BookTitle.TITLE_MAX_LENGTH)`

### Repository 単一操作（Infrastructure層）
- Repositoryの1メソッドは、そのユースケースが要求するアトミックな書き込み単位に対応しているか（無関係な操作を便宜的に1メソッドにまとめていないか）
- テーブル操作（SELECT / INSERT / UPDATE / DELETE）はすべて Repository に集約されているか
- Usecase・Controller に Drizzle ORM の直接呼び出しが混入していないか
- Repository interface の戻り値が Drizzle の推論型（`typeof table.$inferSelect` 等）ではなく domain の Entity/VO 型になっているか
- Repository ファイルがエンドポイント（＝ユースケース）単位でまとまっているか
  - アンチパターン: `get-xxx.repository.ts`（SELECT）・`create-xxx.repository.ts`（INSERT）のように操作種別でファイルを分けている
  - 正しいパターン: `create-xxx.repository.ts` に SELECT / INSERT / UPDATE をまとめて定義している（エンドポイントが必要とする全DB操作を1ファイルに集約）
  - 異なるエンドポイント間で同じDB操作が重複しても共通化しない
  - 1つのユースケースが複数モジュール（例: user と auth）のテーブルへの書き込みを必要とする場合も、そのユースケース専用の Repository メソッド1つに集約してよい（後述の Constraints 参照）

---

## Constraints

- Cloudflare D1 は `db.transaction()` をサポートしない。複数操作のアトミック実行には必ず `db.batch([` を使う
- **`db.batch` は必ず Repository（Infrastructure層）内で完結させる。Controller・Usecase から Drizzle のクエリビルダーを直接呼び出すことは禁止**
  - 同一ユースケース内で複数テーブル（複数モジュールにまたがる場合を含む）への書き込みをアトミックに行う必要がある場合、そのユースケース専用の Repository に両方の insert/update をまとめたメソッドを1つ定義し、その内部で `db.batch` を実行する
  - アンチパターン: Controller や Usecase が `db.batch([db.insert(tableA)..., db.insert(tableB)...])` を直接組み立てている（Repositoryの存在意義がなくなる）
  - 正しいパターン: `ICreateUserRepository.createUserWithLogin(user, login): Promise<void>` のように1メソッドにまとめ、Usecase は `repository.createUserWithLogin(...)` を1回呼ぶだけにする

---

## Procedure

1. 変更されたバックエンドファイルを確認する
2. Controller(Presentation) / Usecase(Application) / Repository(Infrastructure) / Entity・VO(Domain) のレイヤーを特定する
3. 各チェック項目を照合する
4. 以下の形式で報告する

---

## Output Format

違反がある場合：

```
## Backend Review 結果

### 違反あり
- **ファイル**: [ファイルパス:行番号]
- **違反内容**: 具体的な問題
- **修正方針**: 修正の方向性
```

違反がない場合：

```
## Backend Review 結果

チェック完了。問題なし。
```
