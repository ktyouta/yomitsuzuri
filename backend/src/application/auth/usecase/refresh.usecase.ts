import type { EnvConfig } from "../../../config";
import { AccessToken, RefreshToken } from "../../../domain/auth";
import type { IGetUserProfileRepository } from "../../../domain/user";

export type RefreshResult =
  | { status: "invalid_token" }
  | { status: "user_not_found" }
  | { status: "expired" }
  | { status: "success"; accessToken: AccessToken; refreshToken: RefreshToken };

/**
 * トークンリフレッシュユースケース
 */
export class RefreshUsecase {
  constructor(
    private readonly repository: IGetUserProfileRepository,
    private readonly config: EnvConfig
  ) { }

  async execute(refreshToken: RefreshToken): Promise<RefreshResult> {
    let userId;
    try {
      userId = await refreshToken.getPayload();
    } catch {
      return { status: "invalid_token" };
    }

    const userInfo = await this.repository.findById(userId);
    if (!userInfo) {
      return { status: "user_not_found" };
    }

    const isExpired = await refreshToken.isAbsoluteExpired();
    if (isExpired) {
      return { status: "expired" };
    }

    const newRefreshToken = await refreshToken.refresh();
    const accessToken = await AccessToken.create(userId, this.config);

    return { status: "success", accessToken, refreshToken: newRefreshToken };
  }
}
