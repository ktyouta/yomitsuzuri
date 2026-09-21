import type { EnvConfig } from "../../../config";
import { Pepper } from "../../../domain/auth";
import type { IUserPasswordRepository } from "../../../domain/auth";
import { UserId } from "../../../domain/user";

/**
 * パスワード更新ユースケース
 */
export class UpdatePasswordUsecase {
  constructor(
    private readonly repository: IUserPasswordRepository,
    private readonly config: EnvConfig
  ) { }

  /**
   * @returns 更新に成功したか
   */
  async execute(userId: string, nowPassword: string, newPassword: string): Promise<boolean> {
    const userIdObj = UserId.of(userId);
    const credential = await this.repository.getLoginUser(userIdObj);
    if (!credential) {
      return false;
    }

    const pepper = new Pepper(this.config.pepper);
    const isValid = await credential.verifyPassword(nowPassword, pepper);
    if (!isValid) {
      return false;
    }

    const newPasswordHash = await credential.hashNewPassword(newPassword, pepper);
    return await this.repository.updateLoginUser(userIdObj, newPasswordHash);
  }
}
