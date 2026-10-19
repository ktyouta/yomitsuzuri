import type { EnvConfig } from "../../../../config";
import { AccessToken, RefreshToken } from "../../../../domain/user";
import type { IGetUserProfileRepository } from "../../../../domain/user";
import { RefreshResultDto } from "../../dto";

export type RefreshResult =
  | { status: "invalid_token" }
  | { status: "user_not_found" }
  | { status: "expired" }
  | { status: "success"; dto: RefreshResultDto };

type PropsType = {
  refreshToken: RefreshToken;
}

/**
 * トークンリフレッシュユースケース
 */
export class RefreshUsecase {
  constructor(
    private readonly repository: IGetUserProfileRepository,
    private readonly config: EnvConfig
  ) { }

  async execute({ refreshToken }: PropsType): Promise<RefreshResult> {
    let userId;
    try {
      userId = await refreshToken.getPayload();
    } catch {
      return { status: "invalid_token" };
    }

    const userInfo = await this.repository.findUserProfile(userId);
    if (!userInfo) {
      return { status: "user_not_found" };
    }

    const isExpired = await refreshToken.isAbsoluteExpired();
    if (isExpired) {
      return { status: "expired" };
    }

    const newRefreshToken = await refreshToken.refresh();
    const accessToken = await AccessToken.create(userId, this.config);

    return { status: "success", dto: new RefreshResultDto(accessToken, newRefreshToken) };
  }
}
