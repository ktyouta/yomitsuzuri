import { and, eq } from "drizzle-orm";
import { UserLoginEntity, UserPassword, UserSalt } from "../../../domain/auth";
import type { IUserPasswordRepository } from "../../../domain/auth";
import { UserId, UserName } from "../../../domain/user";
import type { Database } from "../../db";
import { userLoginMaster } from "../../db";

/**
 * パスワード変更リポジトリ実装
 */
export class UserPasswordRepository implements IUserPasswordRepository {
  constructor(private readonly db: Database) { }

  async getLoginUser(userId: UserId): Promise<UserLoginEntity | undefined> {
    const result = await this.db
      .select()
      .from(userLoginMaster)
      .where(
        and(
          eq(userLoginMaster.userId, userId.value),
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

  async updateLoginUser(userId: UserId, password: UserPassword): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(userLoginMaster)
      .set({ passwordHash: password.value, updatedAt: now })
      .where(
        and(
          eq(userLoginMaster.userId, userId.value),
          eq(userLoginMaster.deleteFlg, false)
        )
      )
      .returning();
    return result.length > 0;
  }
}
