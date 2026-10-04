import type { IGetUserProfileRepository } from "../../../../domain/user";
import type { UserId } from "../../../../domain/shared";
import { GetAuthenticatedUserResultDto } from "../../dto";

/**
 * 認証済みユーザー取得ユースケース（authMiddleware専用）
 */
export class GetAuthenticatedUserUsecase {
  constructor(private readonly repository: IGetUserProfileRepository) { }

  async execute(userId: UserId): Promise<GetAuthenticatedUserResultDto | undefined> {
    const userInfo = await this.repository.findById(userId);
    if (!userInfo) {
      return undefined;
    }
    return new GetAuthenticatedUserResultDto(userInfo);
  }
}
