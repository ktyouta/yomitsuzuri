import type { UserId } from "../../user";
import type { UserLoginEntity } from "../entity";
import type { UserPassword } from "../value-object";

/**
 * パスワード変更リポジトリインターフェース
 */
export interface IUserPasswordRepository {
  /**
   * ユーザーIDでログイン資格情報を取得
   */
  getLoginUser(userId: UserId): Promise<UserLoginEntity | undefined>;

  /**
   * パスワードを更新
   */
  updateLoginUser(userId: UserId, password: UserPassword): Promise<boolean>;
}
