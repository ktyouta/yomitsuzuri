import { UserId } from "../../../domain/user";
import type { IUpdateUserDarkModeRepository } from "../../../domain/user";

/**
 * ユーザーダークモード設定更新ユースケース
 */
export class UpdateUserDarkModeUsecase {
  constructor(private readonly repository: IUpdateUserDarkModeRepository) { }

  /**
   * @returns 更新に成功したか
   */
  async execute(userId: string, darkMode: boolean): Promise<boolean> {
    const userIdObj = UserId.of(userId);

    return await this.repository.updateDarkMode(userIdObj, darkMode);
  }
}
