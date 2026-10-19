# auth コンテキストの user コンテキストへの統合

## 概要

バックエンドの auth コンテキストを user コンテキストに統合し、ranking-maker リポジトリの `backend` と同様の構成（`UserAggregate`・`UserNameUniquenessDomainService`・`LoginCredentialId` / `LoginId` 等）にする。

振る舞いを変えないリファクタリング（refactor スキル）として扱う。URL・レスポンス・利用者向けのメッセージは変えない。

現状の問題：

- user 側の Repository が auth 側のテーブルにも書き込み（`createUserWithLogin` 等）、`CreateUserUsecase` が auth の `UserLoginEntity` を組み立てており、実態は1つの集約になっている
- 「ログイン名＝ユーザー名」「削除済みユーザーは操作できない」の不変条件が Usecase・Repository に散らばっており、ドメイン層が守っていない
- `UserName` が user と auth の分割のためだけに `domain/shared` に置かれている（他コンテキストからは未使用）
- `UserLoginEntity._loginId`（ログインレコード自身の ID）の型が `UserId` になっている

## 決定事項

### ユーザー決定事項

- ranking-maker の user / auth の構成を基本的にそのまま踏襲する
- yomitsuzuri 独自の箇所は yomitsuzuri を優先する
- 実装前に本設計書を作成する

### Claudeの提案をユーザーが承認したもの

| 項目 | 方針 | 理由 |
|---|---|---|
| ファクトリ名 | `UserAggregate.generate`・`LoginCredentialId.generate` | yomitsuzuri の `BookAggregate.generate`・`UserId.generate` に合わせる |
| `reconstruct` の引数 | 値オブジェクトで受け取る（`UserBirthday.of` を追加） | `BookAggregate.reconstruct` に合わせる |
| 集約のコメント | 事前条件・事後条件の形式で書く | `BookAggregate` に合わせる |
| ドメインサービスの引数 | `isDuplicated(userId, userName)` の位置引数 | `BookTitleUniquenessDomainService` に合わせる |
| ダークモード | 集約に `darkMode: boolean` と `updateDarkMode()` を持たせる（theme は持ち込まない） | yomitsuzuri 独自 |
| エラーメッセージ | `presentation/user/error-message/input/` に統合（ranking-maker の `user.error-message.ts` 1ファイル構成にはしない） | yomitsuzuri 独自 |
| `UserPassword.hash` の引数 | 文字列のまま | 構成とは関係なく、変える必要がない |
| ユーザー更新の処理順 | 重複チェック → ユーザー取得（今のまま） | ranking-maker の順（取得 → 重複チェック）では「ユーザー不在かつ名前重複」の戻り値が DUPLICATE_NAME から NOT_FOUND に変わり、振る舞いが変わる |
| `UserEntity` | 削除する（集約に置き換える） | ranking-maker でも未使用の残骸 |
| ドメインサービスのテスト | 追加する | book のドメインサービスにはテストがある |
| Usecase の戻り値の型 | 今のまま（`DeleteUser` の boolean、`GetAuthenticatedUser` の undefined、`UpdateUserDarkMode` の null、`Refresh` / `Verify` の PropsType） | ranking-maker の Result 化等は契約の変更にあたるため取り込まない |
| Value Object のファクトリ名 | `UserId.generate`・`UserSalt.generate` のまま | ranking-maker の `create` への統一は yomitsuzuri の命名（`create` は Result を返すファクトリ）と異なる |

### 未決定（次回以降に決める）

なし

### 実装時に Claude が判断したもの（未承認）

- 集約のパスワード変更の失敗型は `ChangePasswordError` とした（ranking-maker の `UserValidationError` ではなく、book の `UpdateWorkError` 等のメソッド単位の命名に合わせた）
- パスワード変更・ダークモード更新の Repository の保存メソッドは `updatePassword`・`updateDarkMode` とした（ranking-maker の `updateUser`・`updateTheme` に相当）
- `IGetUserProfileRepository.findById` を `findUserProfile` に改名した（ranking-maker に合わせた）
- 集約はユーザーとログイン情報を JOIN して取得するため、コントローラーのテスト（ユーザー更新・ダークモード更新・ユーザー削除）の準備データにログイン情報の登録を追加した。また、準備データのユーザー名（`test-user-${ulid}`、36文字）が `UserName` の上限（30文字）を超え、集約の復元時に throw するため、`u-${ulid}`（28文字）に変更した。アプリから登録したデータではいずれの状態も起きない（seed にもユーザーは含まれない）
- ログインのテストのうち「プロフィールが存在しない場合」のケースは、ログイン Repository の取得（JOIN）に含まれるため「ユーザーが存在しない場合」に統合した

## 設計

### 層ごとの構成（統合後）

- `domain/user`
  - `aggregate/user-aggregate`: `UserAggregate`
  - `service/user-name-uniqueness`: `UserNameUniquenessDomainService`
  - `repository`: `create-user`・`update-user`・`update-user-dark-mode`・`delete-user`・`get-user-profile`・`update-password`・`user-login`・`user-name-uniqueness`
  - `value-object`: `user-birthday`・`user-name`（shared から移動）・`login-credential-id`（新規）・`login-id`（`login-name` を改名）・auth から移動したもの（`access-token`・`refresh-token`・`cookie`・`header`・`pepper`・`raw-password`・`new-password`・`user-password`・`user-salt`）
- `domain/shared`: `UserId` のみ
- `application/user`: auth の DTO・Usecase を移動
- `infrastructure/user`: auth の Repository を移動。`user-password` は `update-password` に改名。`user-name-uniqueness` を新規追加
- `presentation/user`: auth の Controller・Schema を移動。`user-password` は `update-password` に改名。user ルーターに全ルートをまとめ、`index.ts` から auth の import を削除する

### ファイル一覧

#### 新規

| ファイルパス（`backend/src/`） | 責務 | export するもの |
|---|---|---|
| `domain/user/aggregate/user-aggregate/user-aggregate.ts` | ユーザー（プロフィール・ダークモード・ログイン情報）の集約 | `UserAggregate`、`ChangePasswordError` |
| `domain/user/service/user-name-uniqueness/user-name-uniqueness.domain-service.ts` | ユーザー名の重複判定 | `UserNameUniquenessDomainService` |
| `domain/user/repository/user-name-uniqueness/user-name-uniqueness.repository.interface.ts` | 同名ユーザーの取得 | `IUserNameUniquenessRepository` |
| `domain/user/repository/update-password/update-password.repository.interface.ts` | パスワード変更用の取得・保存（auth の user-password を移動・改名） | `IUpdatePasswordRepository` |
| `domain/user/value-object/login-credential-id/login-credential-id.ts` | ログイン情報レコードの ID | `LoginCredentialId` |
| `domain/user/value-object/login-id/login-id.ts` | ログイン ID（auth の `LoginName` を改名、`of` を追加） | `LoginId`、`LoginIdError` |
| `infrastructure/user/repository/user-name-uniqueness/user-name-uniqueness.repository.ts` | 同名ユーザー取得の実装 | `UserNameUniquenessRepository` |
| `infrastructure/user/repository/update-password/update-password.repository.ts` | パスワード変更の実装（移動・改名） | `UpdatePasswordRepository` |
| `presentation/user/controller/update-password/update-password.controller.ts` | パスワード変更（移動・改名） | `updatePassword` |
| `presentation/user/schema/update-password/update-password.schema.ts` | パスワード変更のスキーマ（移動・改名） | `UpdatePasswordSchema`、`UpdatePasswordSchemaType` |

上記の `index.ts` とテストファイルも追加する。

#### 移動

- `domain/auth/value-object/*` → `domain/user/value-object/*`
- `domain/shared/value-object/user-name` → `domain/user/value-object/user-name`
- `domain/auth/repository/user-login` → `domain/user/repository/user-login`
- `application/auth/dto/*`・`application/auth/usecase/*` → `application/user/dto/*`・`application/user/usecase/*`
- `infrastructure/auth/repository/user-login` → `infrastructure/user/repository/user-login`
- `presentation/auth/controller/*`（user-password 以外）・`presentation/auth/schema/user-login` → `presentation/user/` 配下
- `presentation/auth/error-message/input` の内容 → `presentation/user/error-message/input` に統合

#### 削除

- `domain/auth`・`application/auth`・`infrastructure/auth`・`presentation/auth`
- `domain/auth/entity/user-login`（`UserLoginEntity`）
- `domain/user/entity/user`（`UserEntity`）

### テストの扱い

- 移動したロジックのテストは移動先に合わせて移動する（テスト内容は変更しない）
- Repository のインターフェースが変わるため、Usecase のテストのモックの書き方は変更する。検証している内容（期待値）は変えない
- 新規のクラス（`UserAggregate`・`UserNameUniquenessDomainService`・`LoginCredentialId`・`LoginId.of`・`UserBirthday.of`）は契約に沿ってテストを追加する

### 破綻ケース

- ログイン方法が増える（OAuth、メールアドレスでのログイン等）
- ログイン ID とユーザー名を別々にする

上記のどちらかが入ると、資格情報を独立した集約（コンテキスト）として分け直す必要が出る。

## タスク

各 Phase の完了時に `npm run typecheck`・`npm run lint`・バックエンドのテストを通す。

層ごとに分けると途中の Phase で他の層が壊れ typecheck を通せないため、移動 → 新規クラス → ユースケース単位の置き換え → 外側の層の移動の順に進める。

### Phase 1: domain の移動

- auth の値オブジェクト・Repository インターフェース・`UserLoginEntity`、shared の `UserName` を `domain/user` に移動（`user-password` Repository は `update-password` に改名）
- `LoginName` を `LoginId` に改名
- 各層の import を移動先に合わせる（この時点では Repository インターフェース・Usecase の中身は変えない）

### Phase 2: domain の新規クラス

- `LoginId.of`・`LoginCredentialId`・`UserBirthday.of` を追加
- `UserAggregate`・`UserNameUniquenessDomainService`・`IUserNameUniquenessRepository` を追加

### Phase 3: ユースケース単位の置き換え

ユースケースごとに Repository インターフェース・実装・Usecase・DTO・Controller を集約を使う形に変更する（戻り値の型は変えない）。

- ユーザー作成（`UserNameUniquenessRepository` を追加）
- ユーザー更新
- ダークモード更新
- ユーザー削除
- パスワード変更
- ログイン
- 置き換え後、`UserEntity`・`UserLoginEntity` を削除

### Phase 4: application・infrastructure・presentation の移動

- auth の DTO・Usecase・Repository 実装・Controller・Schema・エラーメッセージを user 側に移動・統合
- user ルーターに全ルートをまとめ、`index.ts` から auth の import を削除

### Phase 5: 仕上げ

- 空になった auth のディレクトリを削除
- CLAUDE.md の「domain/shared の扱い」の例（`UserName`）を修正
- `.claude/skills/backend-review/SKILL.md` 48行目の例（`domain/auth` の `IUserLoginRepository`）を修正

### スコープ外

- Usecase の戻り値の Result 化（ranking-maker の `DeleteUser`・`GetAuthenticatedUser` 等）
- Value Object のファクトリ名の統一（`generate` → `create`）
- ユーザー更新の処理順の変更
- フロントエンドの変更（URL・RPC の型は変わらないため不要の想定）

## クラス仕様（契約）

### UserAggregate

不変条件:

- ログイン ID はユーザー名と同じ値である

| メソッド | 事前条件（満たさない場合は throw） | 事後条件 |
|---|---|---|
| `generate({ name, birthday, password, pepper })`（static, async） | なし | 新しいユーザー ID・ログイン情報 ID・ソルトを採番し、パスワードをハッシュ化して保持する。ダークモードは false、ログイン ID はユーザー名、未削除 |
| `reconstruct(params)`（static） | なし | 渡した値をそのまま保持する |
| `updateUser({ name, birthday })` | 未削除であること | ユーザー名・生年月日を置き換え、ログイン ID をユーザー名にそろえる |
| `updateDarkMode(darkMode)` | 未削除であること | ダークモード設定を置き換える |
| `verifyPassword(rawPassword, pepper)`（async） | 未削除であること | 登録済みのパスワードと一致する場合 true を返す。自身は変更しない |
| `changePassword(nowPassword, newPassword, pepper)`（async） | 未削除であること | 現在のパスワードが一致しない場合は `CURRENT_PASSWORD_MISMATCH` を err で返し、自身は変更しない。一致する場合は同じソルトでハッシュ化した新しいパスワードに置き換え、ok を返す |
| `delete()` | 未削除であること | 削除済みにする |
| `toSnapshot()` | なし | 保持している値をプリミティブで返す。自身は変更しない |

### UserNameUniquenessDomainService

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `isDuplicated(userId, userName)` | なし | userId 以外に同名の未削除ユーザーが存在する場合 true を返す |

### LoginCredentialId

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `generate()` | なし | ULID で新しい ID を生成する |
| `of(value)` | 空でないこと（満たさない場合は throw） | 渡した値を保持する |

### LoginId

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `create(value)` | なし | 空の場合は `LOGIN_ID_EMPTY` を err で返す。それ以外は ok |
| `of(value)` | 空でないこと（満たさない場合は throw） | 渡した値を保持する |

### UserBirthday（追加分）

| メソッド | 事前条件 | 事後条件 |
|---|---|---|
| `of(value)` | `create` の制約を満たすこと（満たさない場合は throw） | 渡した値を保持する |

### Usecase

戻り値の型・事前条件・事後条件は変更しない。内部の処理を集約・ドメインサービス経由に置き換える。

- `LoginUsecase` の入力値の違反の型は `LoginNameError`（`LOGIN_NAME_EMPTY`）から `LoginIdError`（`LOGIN_ID_EMPTY`）に変わる。利用者向けのメッセージ（「ユーザー名を入力してください」）は変えない
- `LoginUsecase` はプロフィール取得 Repository を使わず、ログイン Repository が返す集約から DTO を作る（ユーザーまたはログイン情報が削除済みの場合は取得されず、今と同じく `AUTHENTICATION_FAILED`）
