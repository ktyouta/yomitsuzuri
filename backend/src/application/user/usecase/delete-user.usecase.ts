import { UserId } from "../../../domain/user";
import type { IDeleteUserRepository } from "../../../domain/user";

/**
 * ユーザー削除ユースケース
 */
export class DeleteUserUsecase {
  constructor(private readonly repository: IDeleteUserRepository) { }

  async execute(userId: string): Promise<boolean> {
    const userIdObj = UserId.of(userId);
    return await this.repository.deleteUserWithLogin(userIdObj);
  }
}
