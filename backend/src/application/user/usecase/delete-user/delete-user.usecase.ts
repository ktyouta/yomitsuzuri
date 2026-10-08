import type { UserId } from "../../../../domain/shared";
import type { IDeleteUserRepository } from "../../../../domain/user";

/**
 * ユーザー削除ユースケース
 */
export class DeleteUserUsecase {
  constructor(private readonly repository: IDeleteUserRepository) { }

  async execute(userId: UserId): Promise<boolean> {
    return await this.repository.deleteUserWithLogin(userId);
  }
}
