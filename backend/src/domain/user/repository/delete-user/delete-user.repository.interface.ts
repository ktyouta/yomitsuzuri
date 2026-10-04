import type { UserId } from "../../../shared";

/**
 * ユーザー削除リポジトリインターフェース
 */
export interface IDeleteUserRepository {
  /**
   * ユーザーとログイン情報をアトミックに論理削除する
   */
  deleteUserWithLogin(userId: UserId): Promise<boolean>;
}
