import { and, eq } from "drizzle-orm";
import { LoginCredentialId, LoginId, UserAggregate, UserBirthday, UserName, UserPassword, UserSalt, type IUpdateUserDarkModeRepository } from "../../../../domain/user";
import { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { userLoginMaster, userMaster } from "../../../db";

/**
 * ユーザーダークモード設定更新リポジトリ実装
 */
export class UpdateUserDarkModeRepository implements IUpdateUserDarkModeRepository {
  constructor(private readonly db: Database) { }

  async findUser(userId: UserId): Promise<UserAggregate | null> {
    const result = await this.db
      .select({
        userId: userMaster.id,
        name: userMaster.name,
        birthday: userMaster.birthday,
        darkMode: userMaster.darkMode,
        loginCredentialId: userLoginMaster.id,
        loginId: userLoginMaster.loginId,
        passwordHash: userLoginMaster.passwordHash,
        salt: userLoginMaster.salt,
        deleteFlg: userMaster.deleteFlg,
      })
      .from(userMaster)
      .innerJoin(userLoginMaster, eq(userMaster.id, userLoginMaster.userId))
      .where(
        and(
          eq(userMaster.id, userId.value),
          eq(userMaster.deleteFlg, false),
          eq(userLoginMaster.deleteFlg, false)
        )
      );
    const row = result[0];
    if (!row) {
      return null;
    }

    return UserAggregate.reconstruct({
      id: UserId.of(row.userId),
      name: UserName.of(row.name),
      birthday: UserBirthday.of(row.birthday),
      darkMode: row.darkMode,
      loginCredentialId: LoginCredentialId.of(row.loginCredentialId),
      loginId: LoginId.of(row.loginId),
      password: UserPassword.of(row.passwordHash),
      salt: UserSalt.of(row.salt),
      deleteFlg: row.deleteFlg,
    });
  }

  async updateDarkMode(user: UserAggregate): Promise<boolean> {
    const now = new Date().toISOString();
    const userSnapshot = user.toSnapshot();

    const result = await this.db
      .update(userMaster)
      .set({ darkMode: userSnapshot.darkMode, updatedAt: now })
      .where(
        and(
          eq(userMaster.id, userSnapshot.id),
          eq(userMaster.deleteFlg, false)
        )
      )
      .returning();

    return result.length > 0;
  }
}
