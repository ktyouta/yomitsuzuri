import type { EnvConfig } from "../../../config";
import { AccessToken, Pepper, RefreshToken, UserLoginEntity, UserPassword, UserSalt } from "../../../domain/auth";
import { UserBirthday, UserEntity, UserId, UserName } from "../../../domain/user";
import type { ICreateUserRepository } from "../../../domain/user";

export type CreateUserResult = {
  entity: UserEntity;
  accessToken: AccessToken;
  refreshToken: RefreshToken;
};

/**
 * ユーザー作成ユースケース
 */
export class CreateUserUsecase {
  constructor(
    private readonly repository: ICreateUserRepository,
    private readonly config: EnvConfig
  ) { }

  /**
   * ユーザーを新規作成する
   * @returns 作成結果。ユーザー名が重複している場合は null
   */
  async execute(name: string, birthday: string, password: string): Promise<CreateUserResult | null> {
    const userName = new UserName(name);
    const userBirthday = new UserBirthday(birthday);
    const salt = UserSalt.generate();
    const pepper = new Pepper(this.config.pepper);
    const userPassword = await UserPassword.hash(password, salt, pepper);

    const exists = await this.repository.existsByUserName(userName);
    if (exists) {
      return null;
    }

    const userId = UserId.generate();
    const loginId = UserId.generate();
    const userEntity = new UserEntity(userId, userName, userBirthday);
    const userLoginEntity = new UserLoginEntity(loginId, userId, userName, userPassword, salt);

    await this.repository.createUserWithLogin(userEntity, userLoginEntity);

    const accessToken = await AccessToken.create(userId, this.config);
    const refreshToken = await RefreshToken.create(userId, this.config);

    return { entity: userEntity, accessToken, refreshToken };
  }
}
