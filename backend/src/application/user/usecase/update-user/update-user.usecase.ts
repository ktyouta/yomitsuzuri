import type { EnvConfig } from "../../../../config";
import { RefreshToken } from "../../../../domain/auth";
import { UserBirthday, UserName } from "../../../../domain/user";
import { UserId } from "../../../../domain/shared";
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

  async execute(userId: string, name: string, birthday: string): Promise<UpdateUserResult> {
    const userIdObj = UserId.of(userId);
    const userName = new UserName(name);
    const userBirthday = new UserBirthday(birthday);

    const duplicated = await this.repository.checkUserNameExists(userIdObj, userName);
    if (duplicated) {
      return { status: "duplicate" };
    }

    const updateResult = await this.repository.updateUserWithLogin(userIdObj, userName, userBirthday);
    if (!updateResult) {
      return { status: "not_found" };
    }

    const refreshToken = await RefreshToken.create(userIdObj, this.config);

    return { status: "success", dto: new UpdateUserResultDto(updateResult.entity, updateResult.darkMode, refreshToken) };
  }
}
