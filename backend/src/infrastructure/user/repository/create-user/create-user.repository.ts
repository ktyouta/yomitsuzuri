import type { ICreateUserRepository, UserAggregate } from "../../../../domain/user";
import type { Database } from "../../../db";
import { userLoginMaster, userMaster } from "../../../db";

/**
 * ユーザー作成リポジトリ実装
 */
export class CreateUserRepository implements ICreateUserRepository {
  constructor(private readonly db: Database) { }

  async createUser(user: UserAggregate): Promise<void> {
    const now = new Date().toISOString();
    const userSnapshot = user.toSnapshot();

    await this.db.batch([
      this.db.insert(userMaster).values({
        id: userSnapshot.id,
        name: userSnapshot.name,
        birthday: userSnapshot.birthday,
        darkMode: userSnapshot.darkMode,
        deleteFlg: userSnapshot.deleteFlg,
        createdAt: now,
        updatedAt: now,
      }),
      this.db.insert(userLoginMaster).values({
        id: userSnapshot.loginCredentialId,
        userId: userSnapshot.id,
        loginId: userSnapshot.loginId,
        passwordHash: userSnapshot.passwordHash,
        salt: userSnapshot.salt,
        deleteFlg: userSnapshot.deleteFlg,
        createdAt: now,
        updatedAt: now,
      }),
    ]);
  }
}
