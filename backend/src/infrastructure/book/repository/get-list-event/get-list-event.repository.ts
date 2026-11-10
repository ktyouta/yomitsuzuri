import { and, asc, eq } from "drizzle-orm";
import type { EventListItem, IGetListEventRepository, UserId, WorkId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, eventTransaction, workTransaction } from "../../../db";

/**
 * 出来事一覧取得リポジトリ実装
 */
export class GetListEventRepository implements IGetListEventRepository {
  constructor(private readonly db: Database) { }

  async findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null> {
    const [work] = await this.db
      .select({
        id: workTransaction.id,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(this.buildWorkCondition(userId, workId));

    return work ?? null;
  }

  async findEventList(userId: UserId, workId: WorkId): Promise<EventListItem[]> {
    return this.db
      .select({
        id: eventTransaction.id,
        occurredTiming: eventTransaction.occurredTiming,
        content: eventTransaction.content,
        sortOrder: eventTransaction.sortOrder,
        deleteFlg: eventTransaction.deleteFlg,
      })
      .from(eventTransaction)
      // 他ユーザー・論理削除済みの作品・書籍の出来事を返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(eventTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(this.buildWorkCondition(userId, workId))
      // 削除済みを末尾にするため削除フラグを第1キーにする（docs/delete-restore/plan.md の U12）
      // 削除済み同士は時系列順が NULL で並ぶことがあり、時系列順には一意制約もないため、順序を固定するよう id を最後のキーにする
      .orderBy(asc(eventTransaction.deleteFlg), asc(eventTransaction.sortOrder), asc(eventTransaction.id));
  }

  /**
   * 作品と出来事で共通の作品の抽出条件（出来事側への所有者条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 指定ユーザーの論理削除されていない書籍に属する、論理削除されていない指定作品を抽出する条件
   */
  private buildWorkCondition(userId: UserId, workId: WorkId) {
    return and(
      eq(workTransaction.id, workId.value),
      eq(workTransaction.deleteFlg, false),
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false)
    );
  }
}
