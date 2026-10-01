import { UserId } from "../../../domain/user";
import type { IUpdateUserDarkModeRepository } from "../../../domain/user";
import { UpdateUserDarkModeResultDto } from "../dto";

/**
 * ユーザーダークモード設定更新ユースケース
 */
export class UpdateUserDarkModeUsecase {
  constructor(private readonly repository: IUpdateUserDarkModeRepository) { }

  /**
   * @returns 更新結果。対象ユーザーが存在しない場合は null
   */
  async execute(userId: string, darkMode: boolean): Promise<UpdateUserDarkModeResultDto | null> {
    const userIdObj = UserId.of(userId);

    const updated = await this.repository.updateDarkMode(userIdObj, darkMode);
    if (!updated) {
      return null;
    }

    return new UpdateUserDarkModeResultDto(darkMode);
  }
}
