import { and, eq } from "drizzle-orm";
import type { IGetUserProfileRepository, UserId, UserProfile } from "../../../domain/user";
import type { Database } from "../../db";
import { userMaster } from "../../db";

/**
 * ユーザープロフィール取得リポジトリ実装
 */
export class GetUserProfileRepository implements IGetUserProfileRepository {
  constructor(private readonly db: Database) { }

  async findById(userId: UserId): Promise<UserProfile | undefined> {
    const result = await this.db
      .select()
      .from(userMaster)
      .where(
        and(
          eq(userMaster.id, userId.value),
          eq(userMaster.deleteFlg, false)
        )
      );
    const row = result[0];
    if (!row) {
      return undefined;
    }
    return { id: row.id, name: row.name, birthday: row.birthday, darkMode: row.darkMode };
  }
}
