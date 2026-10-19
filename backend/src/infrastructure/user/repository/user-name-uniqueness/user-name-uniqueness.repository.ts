import { and, eq, ne } from "drizzle-orm";
import type { IUserNameUniquenessRepository, UserName } from "../../../../domain/user";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { userMaster } from "../../../db";

/**
 * ユーザー名一意性判定リポジトリ実装
 */
export class UserNameUniquenessRepository implements IUserNameUniquenessRepository {
  constructor(private readonly db: Database) { }

  /**
   * 同名ユーザーの取得（未削除のもの）
   * userId 自身は除外する（更新時の自己重複を防ぐ）。
   * @param userId 判定対象から除外するユーザーID
   * @param userName ユーザー名
   * @returns 同名ユーザーの ID 一覧
   */
  async findUser(userId: UserId, userName: UserName): Promise<{ id: string }[]> {
    const result = await this.db
      .select({
        id: userMaster.id,
      })
      .from(userMaster)
      .where(and(
        eq(userMaster.deleteFlg, false),
        eq(userMaster.name, userName.value),
        ne(userMaster.id, userId.value),
      ));

    return result;
  }
}
