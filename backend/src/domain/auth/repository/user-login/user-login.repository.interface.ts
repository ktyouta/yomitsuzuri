import type { UserId } from "../../../shared";
import type { UserLoginEntity } from "../../entity";
import type { LoginName } from "../../value-object";

/**
 * ログインリポジトリインターフェース
 */
export interface IUserLoginRepository {
  /**
   * ログインID（ユーザー名）でログイン資格情報を取得
   * @param loginName ログイン時に入力されたユーザー名
   * @returns 削除されていない資格情報（存在しない場合は undefined）
   */
  getLoginUser(loginName: LoginName): Promise<UserLoginEntity | undefined>;

  /**
   * 最終ログイン日時を更新
   */
  updateLastLoginDate(userId: UserId): Promise<void>;
}
