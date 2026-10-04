import { and, eq } from "drizzle-orm";
import type { IUpdateUserDarkModeRepository } from "../../../../domain/user";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { userMaster } from "../../../db";

/**
 * ユーザーダークモード設定更新リポジトリ実装
 */
export class UpdateUserDarkModeRepository implements IUpdateUserDarkModeRepository {
  constructor(private readonly db: Database) { }

  async updateDarkMode(userId: UserId, darkMode: boolean): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(userMaster)
      .set({ darkMode, updatedAt: now })
      .where(
        and(
          eq(userMaster.id, userId.value),
          eq(userMaster.deleteFlg, false)
        )
      )
      .returning();

    return result.length > 0;
  }
}
