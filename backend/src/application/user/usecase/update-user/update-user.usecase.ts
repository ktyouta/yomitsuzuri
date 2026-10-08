import type { EnvConfig } from "../../../../config";
import { RefreshToken } from "../../../../domain/auth";
import { UserBirthday } from "../../../../domain/user";
import { UserName } from "../../../../domain/shared";
import type { UserId } from "../../../../domain/shared";
import type { IUpdateUserRepository } from "../../../../domain/user";
import { UpdateUserResultDto } from "../../dto";

export type UpdateUserResult =
  | { status: "duplicate" }
  | { status: "not_found" }
  | { status: "success"; dto: UpdateUserResultDto };

/**
 * ユーザー更新ユースケース
 */
export class UpdateUserUsecase {
  constructor(
    private readonly repository: IUpdateUserRepository,
    private readonly config: EnvConfig
  ) { }

  async execute(userId: UserId, name: string, birthday: string): Promise<UpdateUserResult> {
    const userName = new UserName(name);
    const userBirthday = new UserBirthday(birthday);

    const duplicated = await this.repository.checkUserNameExists(userId, userName);
    if (duplicated) {
      return { status: "duplicate" };
    }

    const updateResult = await this.repository.updateUserWithLogin(userId, userName, userBirthday);
    if (!updateResult) {
      return { status: "not_found" };
    }

    const refreshToken = await RefreshToken.create(userId, this.config);

    return { status: "success", dto: new UpdateUserResultDto(updateResult.entity, updateResult.darkMode, refreshToken) };
  }
}
