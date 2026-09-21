import { and, eq, ne } from "drizzle-orm";
import { UserEntity } from "../../../domain/user";
import type { IUpdateUserRepository, UserBirthday, UserId, UserName } from "../../../domain/user";
import type { Database } from "../../db";
import { userLoginMaster, userMaster } from "../../db";

/**
 * ユーザー更新リポジトリ実装
 */
export class UpdateUserRepository implements IUpdateUserRepository {
  constructor(private readonly db: Database) { }

  async checkUserNameExists(userId: UserId, userName: UserName): Promise<boolean> {
    const result = await this.db
      .select()
      .from(userMaster)
      .where(
        and(
          eq(userMaster.name, userName.value),
          ne(userMaster.id, userId.value),
          eq(userMaster.deleteFlg, false)
        )
      );
    return result.length > 0;
  }

  async updateUserWithLogin(
    userId: UserId,
    userName: UserName,
    userBirthday: UserBirthday
  ): Promise<{ entity: UserEntity; darkMode: boolean } | undefined> {
    const now = new Date().toISOString();
    const [, updateResult] = await this.db.batch([
      this.db.update(userLoginMaster)
        .set({ loginId: userName.value, updatedAt: now })
        .where(
          and(
            eq(userLoginMaster.userId, userId.value),
            eq(userLoginMaster.deleteFlg, false)
          )
        ),
      this.db.update(userMaster)
        .set({
          name: userName.value,
          birthday: userBirthday.value,
          updatedAt: now,
        })
        .where(
          and(
            eq(userMaster.id, userId.value),
            eq(userMaster.deleteFlg, false)
          )
        )
        .returning(),
    ]);

    const row = updateResult[0];
    if (!row) {
      return undefined;
    }
    return { entity: new UserEntity(userId, userName, userBirthday), darkMode: row.darkMode };
  }
}
