import type { UserId } from "../../../shared";
import type { UserAggregate } from "../../aggregate";

/**
 * ユーザーダークモード設定更新リポジトリインターフェース
 */
export interface IUpdateUserDarkModeRepository {
  /**
   * ユーザーIDでユーザーを取得
   * @param userId 取得対象のユーザーID
   * @returns ユーザーとログイン情報がともに削除されていないユーザー（存在しない場合は null）
   */
  findUser(userId: UserId): Promise<UserAggregate | null>;

  /**
   * ダークモード設定を保存する
   * @param user ダークモード設定を変更したユーザー
   * @returns 更新できた場合は true（削除済み・存在しない場合は false）
   */
  updateDarkMode(user: UserAggregate): Promise<boolean>;
}
