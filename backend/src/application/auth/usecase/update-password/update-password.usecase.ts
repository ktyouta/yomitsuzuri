import type { EnvConfig } from "../../../../config";
import { Pepper } from "../../../../domain/auth";
import type { IUserPasswordRepository } from "../../../../domain/auth";
import type { UserId } from "../../../../domain/shared";

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
  async execute(userId: UserId, nowPassword: string, newPassword: string): Promise<boolean> {
    const credential = await this.repository.getLoginUser(userId);
    if (!credential) {
      return false;
    }

    const pepper = new Pepper(this.config.pepper);
    const isValid = await credential.verifyPassword(nowPassword, pepper);
    if (!isValid) {
      return false;
    }

    const newPasswordHash = await credential.hashNewPassword(newPassword, pepper);
    return await this.repository.updateLoginUser(userId, newPasswordHash);
  }
}
