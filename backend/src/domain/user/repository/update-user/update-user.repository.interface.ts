import type { UserEntity } from "../../entity";
import type { UserBirthday, UserName } from "../../value-object";
import type { UserId } from "../../../shared";

/**
 * ユーザー更新リポジトリインターフェース
 */
export interface IUpdateUserRepository {
  /**
   * 自分以外に同名のユーザーが存在するかチェック
   */
  checkUserNameExists(userId: UserId, userName: UserName): Promise<boolean>;

  /**
   * ユーザーとログイン情報をアトミックに更新する
   */
  updateUserWithLogin(
    userId: UserId,
    userName: UserName,
    userBirthday: UserBirthday
  ): Promise<{ entity: UserEntity; darkMode: boolean } | undefined>;
}
