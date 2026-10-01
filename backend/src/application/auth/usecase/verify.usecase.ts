import type { EnvConfig } from "../../../config";
import { AccessToken, RefreshToken } from "../../../domain/auth";
import type { IGetUserProfileRepository } from "../../../domain/user";
import { VerifyResultDto } from "../dto";

export type VerifyResult =
  | { status: "user_not_found" }
  | { status: "expired" }
  | { status: "success"; dto: VerifyResultDto };

/**
 * 認証チェックユースケース
 */
export class VerifyUsecase {
  constructor(
    private readonly repository: IGetUserProfileRepository,
    private readonly config: EnvConfig
  ) { }

  async execute(refreshToken: RefreshToken): Promise<VerifyResult> {
    const userId = await refreshToken.getPayload();

    const userInfo = await this.repository.findById(userId);
    if (!userInfo) {
      return { status: "user_not_found" };
    }

    const isExpired = await refreshToken.isAbsoluteExpired();
    if (isExpired) {
      return { status: "expired" };
    }

    const accessToken = await AccessToken.create(userId, this.config);

    return { status: "success", dto: new VerifyResultDto(accessToken, userInfo) };
  }
}
