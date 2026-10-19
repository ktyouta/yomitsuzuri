import type { UserId } from "../../../shared";
import type { UserAggregate } from "../../aggregate";
import type { LoginId } from "../../value-object";

/**
 * ログインリポジトリインターフェース
 */
export interface IUserLoginRepository {
  /**
   * ログインID（ユーザー名）でユーザーを取得
   * @param loginId ログイン時に入力されたユーザー名
   * @returns ユーザーとログイン情報がともに削除されていないユーザー（存在しない場合は null）
   */
  findUser(loginId: LoginId): Promise<UserAggregate | null>;

  /**
   * 最終ログイン日時を更新
   */
  updateLastLoginDate(userId: UserId): Promise<void>;
}
