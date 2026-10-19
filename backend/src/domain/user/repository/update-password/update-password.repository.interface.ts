import type { UserId } from "../../../shared";
import type { UserAggregate } from "../../aggregate";

/**
 * パスワード変更リポジトリインターフェース
 */
export interface IUpdatePasswordRepository {
  /**
   * ユーザーIDでユーザーを取得
   * @param userId 取得対象のユーザーID
   * @returns ユーザーとログイン情報がともに削除されていないユーザー（存在しない場合は null）
   */
  findUser(userId: UserId): Promise<UserAggregate | null>;

  /**
   * パスワードを保存する
   * @param user パスワードを変更したユーザー
   * @returns 更新できた場合は true（削除済み・存在しない場合は false）
   */
  updatePassword(user: UserAggregate): Promise<boolean>;
}
