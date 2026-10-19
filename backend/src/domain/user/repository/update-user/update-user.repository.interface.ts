import type { UserId } from "../../../shared";
import type { UserAggregate } from "../../aggregate";

/**
 * ユーザー更新リポジトリインターフェース
 */
export interface IUpdateUserRepository {
  /**
   * ユーザーIDでユーザーを取得
   * @param userId 取得対象のユーザーID
   * @returns ユーザーとログイン情報がともに削除されていないユーザー（存在しない場合は null）
   */
  findUser(userId: UserId): Promise<UserAggregate | null>;

  /**
   * ユーザーとログイン情報をアトミックに更新する
   * @param user ユーザー情報を変更したユーザー
   * @returns 更新できた場合は true（削除済み・存在しない場合は false）
   */
  updateUser(user: UserAggregate): Promise<boolean>;
}
