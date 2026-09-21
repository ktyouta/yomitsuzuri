import { and, eq } from "drizzle-orm";
import type { UserLoginEntity } from "../../../domain/auth";
import type { ICreateUserRepository, UserEntity, UserName } from "../../../domain/user";
import type { Database } from "../../db";
import { userLoginMaster, userMaster } from "../../db";

/**
 * ユーザー作成リポジトリ実装
 */
export class CreateUserRepository implements ICreateUserRepository {
  constructor(private readonly db: Database) { }

  async existsByUserName(userName: UserName): Promise<boolean> {
    const result = await this.db
      .select()
      .from(userMaster)
      .where(
        and(
          eq(userMaster.name, userName.value),
          eq(userMaster.deleteFlg, false)
        )
      );
    return result.length > 0;
  }

  async createUserWithLogin(user: UserEntity, login: UserLoginEntity): Promise<void> {
    const now = new Date().toISOString();
    await this.db.batch([
      this.db.insert(userMaster).values({
        id: user.userId,
        name: user.userName,
        birthday: user.userBirthday,
        deleteFlg: false,
        createdAt: now,
        updatedAt: now,
      }),
      this.db.insert(userLoginMaster).values({
        id: login.loginId,
        userId: login.userId,
        loginId: login.loginName,
        passwordHash: login.passwordHash,
        salt: login.salt,
        authProvider: "password",
        deleteFlg: false,
        createdAt: now,
        updatedAt: now,
      }),
    ]);
  }
}
