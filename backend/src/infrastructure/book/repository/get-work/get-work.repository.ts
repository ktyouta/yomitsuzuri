import { and, eq } from "drizzle-orm";
import type { IGetWorkRepository, WorkId, WorkType } from "../../../../domain";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, iconMaster, workTransaction } from "../../../db";

/**
 * 作品詳細取得リポジトリ実装
 */
export class GetWorkRepository implements IGetWorkRepository {
  constructor(private readonly db: Database) { }

  async findWork(userId: UserId, workId: WorkId): Promise<WorkType | null> {
    const result = await this.db
      .select({
        id: workTransaction.id,
        title: workTransaction.title,
        memo: workTransaction.memo,
        iconId: workTransaction.iconId,
        icon: iconMaster.emoji,
        updatedAt: workTransaction.updatedAt,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      // 論理削除されたアイコンは null として返し、表示側でデフォルトアイコンに差し替える
      .leftJoin(
        iconMaster,
        and(
          eq(workTransaction.iconId, iconMaster.id),
          eq(iconMaster.deleteFlg, false)
        )
      )
      .where(and(
        eq(workTransaction.id, workId.value),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false)
      ));

    if (!result[0]) {
      return null;
    }
    return result[0];
  }
}
