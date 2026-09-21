import { and, eq } from "drizzle-orm";
import { UserLoginEntity, UserPassword, UserSalt } from "../../../domain/auth";
import type { IUserLoginRepository } from "../../../domain/auth";
import { UserId, UserName } from "../../../domain/user";
import type { Database } from "../../db";
import { userLoginMaster, userMaster } from "../../db";

/**
 * ログインリポジトリ実装
 */
export class UserLoginRepository implements IUserLoginRepository {
  constructor(private readonly db: Database) { }

  async getLoginUser(loginId: UserName): Promise<UserLoginEntity | undefined> {
    const result = await this.db
      .select()
      .from(userLoginMaster)
      .where(
        and(
          eq(userLoginMaster.loginId, loginId.value),
          eq(userLoginMaster.deleteFlg, false)
        )
      );
    const row = result[0];
    if (!row) {
      return undefined;
    }
    return new UserLoginEntity(
      UserId.of(row.id),
      UserId.of(row.userId),
      new UserName(row.loginId),
      UserPassword.of(row.passwordHash),
      UserSalt.of(row.salt)
    );
  }

  async updateLastLoginDate(userId: UserId): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(userMaster)
      .set({ lastLoginDate: now, updatedAt: now })
      .where(eq(userMaster.id, userId.value));
  }
}
