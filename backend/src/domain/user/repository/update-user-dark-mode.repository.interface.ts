import type { UserId } from "../value-object";

/**
 * ユーザーダークモード設定更新リポジトリインターフェース
 */
export interface IUpdateUserDarkModeRepository {
  /**
   * ダークモード設定を更新する
   * @returns 更新に成功したか
   */
  updateDarkMode(userId: UserId, darkMode: boolean): Promise<boolean>;
}
