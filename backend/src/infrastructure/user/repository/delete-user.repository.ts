import { and, eq } from "drizzle-orm";
import type { IDeleteUserRepository, UserId } from "../../../domain/user";
import type { Database } from "../../db";
import { userLoginMaster, userMaster } from "../../db";

/**
 * ユーザー削除リポジトリ実装
 */
export class DeleteUserRepository implements IDeleteUserRepository {
  constructor(private readonly db: Database) { }

  async deleteUserWithLogin(userId: UserId): Promise<boolean> {
    const now = new Date().toISOString();
    const [, deleteResult] = await this.db.batch([
      this.db.update(userLoginMaster)
        .set({ deleteFlg: true, updatedAt: now })
        .where(
          and(
            eq(userLoginMaster.userId, userId.value),
            eq(userLoginMaster.deleteFlg, false)
          )
        ),
      this.db.update(userMaster)
        .set({ deleteFlg: true, updatedAt: now })
        .where(
          and(
            eq(userMaster.id, userId.value),
            eq(userMaster.deleteFlg, false)
          )
        )
        .returning(),
    ]);
    return deleteResult.length > 0;
  }
}
