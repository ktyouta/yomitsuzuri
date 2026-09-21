import type { UserLoginEntity } from "../../auth";
import type { UserEntity } from "../entity";
import type { UserName } from "../value-object";

/**
 * ユーザー作成リポジトリインターフェース
 */
export interface ICreateUserRepository {
  /**
   * ユーザー名の重複チェック
   */
  existsByUserName(userName: UserName): Promise<boolean>;

  /**
   * ユーザーとログイン情報をアトミックに作成する
   */
  createUserWithLogin(user: UserEntity, login: UserLoginEntity): Promise<void>;
}
