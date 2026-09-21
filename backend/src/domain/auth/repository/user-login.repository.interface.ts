import type { UserId, UserName } from "../../user";
import type { UserLoginEntity } from "../entity";

/**
 * ログインリポジトリインターフェース
 */
export interface IUserLoginRepository {
  /**
   * ログインID（ユーザー名）でログイン資格情報を取得
   */
  getLoginUser(loginId: UserName): Promise<UserLoginEntity | undefined>;

  /**
   * 最終ログイン日時を更新
   */
  updateLastLoginDate(userId: UserId): Promise<void>;
}
