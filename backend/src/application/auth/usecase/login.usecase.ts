import type { EnvConfig } from "../../../config";
import { AccessToken, Pepper, RefreshToken } from "../../../domain/auth";
import type { IUserLoginRepository } from "../../../domain/auth";
import { UserId, UserName } from "../../../domain/user";
import type { IGetUserProfileRepository, UserProfile } from "../../../domain/user";

export type LoginResult = {
  userInfo: UserProfile;
  accessToken: AccessToken;
  refreshToken: RefreshToken;
};

/**
 * ログインユースケース
 */
export class LoginUsecase {
  constructor(
    private readonly loginRepository: IUserLoginRepository,
    private readonly userProfileRepository: IGetUserProfileRepository,
    private readonly config: EnvConfig
  ) { }

  async execute(name: string, password: string): Promise<LoginResult | null> {
    const loginId = new UserName(name);
    const credential = await this.loginRepository.getLoginUser(loginId);
    if (!credential) {
      return null;
    }

    const pepper = new Pepper(this.config.pepper);
    const isValid = await credential.verifyPassword(password, pepper);
    if (!isValid) {
      return null;
    }

    const userId = UserId.of(credential.userId);
    const userInfo = await this.userProfileRepository.findById(userId);
    if (!userInfo) {
      return null;
    }

    const accessToken = await AccessToken.create(userId, this.config);
    const refreshToken = await RefreshToken.create(userId, this.config);

    await this.loginRepository.updateLastLoginDate(userId);

    return { userInfo, accessToken, refreshToken };
  }
}
