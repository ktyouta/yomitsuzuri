import type { UserId } from "../../../shared";
import type { UserAggregate } from "../../aggregate";

/**
 * ユーザー削除リポジトリインターフェース
 */
export interface IDeleteUserRepository {
  /**
   * ユーザーIDでユーザーを取得
   * @param userId 取得対象のユーザーID
   * @returns ユーザーとログイン情報がともに削除されていないユーザー（存在しない場合は null）
   */
  findUser(userId: UserId): Promise<UserAggregate | null>;

  /**
   * ユーザーとログイン情報をアトミックに論理削除する
   * @param user 削除済みにしたユーザー
   * @returns 削除できた場合は true（削除済み・存在しない場合は false）
   */
  deleteUser(user: UserAggregate): Promise<boolean>;
}
