import type { UserId } from "../value-object";

/**
 * ユーザー削除リポジトリインターフェース
 */
export interface IDeleteUserRepository {
  /**
   * ユーザーとログイン情報をアトミックに論理削除する
   */
  deleteUserWithLogin(userId: UserId): Promise<boolean>;
}
