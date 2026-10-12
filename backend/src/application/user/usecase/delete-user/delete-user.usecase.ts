import type { UserId } from "../../../../domain/shared";
import type { IDeleteUserRepository } from "../../../../domain/user";

type PropsType = {
  userId: UserId;
}

/**
 * ユーザー削除ユースケース
 */
export class DeleteUserUsecase {
  constructor(private readonly repository: IDeleteUserRepository) { }

  async execute({ userId }: PropsType): Promise<boolean> {
    return await this.repository.deleteUserWithLogin(userId);
  }
}
