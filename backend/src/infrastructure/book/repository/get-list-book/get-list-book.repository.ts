import { and, count, desc, eq, gte, like, lt, or, sql } from "drizzle-orm";
import type { BookListItem, BookListQueryType, IGetListBookRepository, UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, iconMaster, readingStatusMaster, workTransaction } from "../../../db";

/**
 * 書籍一覧取得リポジトリ実装
 */
export class GetListBookRepository implements IGetListBookRepository {
  constructor(private readonly db: Database) { }

  async findBookList(userId: UserId, query: BookListQueryType, pageSize: number): Promise<BookListItem[]> {
    return this.db
      .select({
        id: bookTransaction.id,
        title: bookTransaction.title,
        updatedAt: bookTransaction.updatedAt,
        readingStatusId: bookTransaction.readingStatusId,
        readingStatusLabel: readingStatusMaster.label,
        workCount: sql<number>`(select count(*) from ${workTransaction} where ${and(
          eq(workTransaction.bookId, bookTransaction.id),
          eq(workTransaction.deleteFlg, false)
        )})`.mapWith(Number),
        icon: iconMaster.emoji,
      })
      .from(bookTransaction)
      // 論理削除されたマスタの表示名を使わせないため、結合条件で除外して null として返す
      .leftJoin(
        readingStatusMaster,
        and(
          eq(bookTransaction.readingStatusId, readingStatusMaster.id),
          eq(readingStatusMaster.deleteFlg, false)
        )
      )
      // 論理削除されたアイコンは null として返し、表示側でデフォルトアイコンに差し替える
      .leftJoin(
        iconMaster,
        and(
          eq(bookTransaction.iconId, iconMaster.id),
          eq(iconMaster.deleteFlg, false)
        )
      )
      .where(this.buildCondition(userId, query))
      // 更新日時が同じ書籍の順序をページ間で固定するため id を第2キーにする
      .orderBy(desc(bookTransaction.updatedAt), desc(bookTransaction.id))
      .limit(pageSize)
      .offset((query.page.value - 1) * pageSize);
  }

  async countBook(userId: UserId, query: BookListQueryType): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(bookTransaction)
      .where(this.buildCondition(userId, query));

    return total;
  }

  /**
   * 一覧と件数で共通の抽出条件（件数側への条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @param query 検索条件
   * @returns 指定ユーザーの論理削除されていない書籍のうち、検索条件に合うものを抽出する条件
   */
  private buildCondition(userId: UserId, query: BookListQueryType) {
    return and(
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false),
      ...(query.keyword ? [or(like(bookTransaction.title, `%${query.keyword}%`), like(bookTransaction.memo, `%${query.keyword}%`))] : []),
      ...(query.createdAtFrom ? [gte(bookTransaction.createdAt, query.createdAtFrom.value)] : []),
      ...(query.createdAtTo ? [lt(bookTransaction.createdAt, query.createdAtTo.value)] : []),
      ...(query.updatedAtFrom ? [gte(bookTransaction.updatedAt, query.updatedAtFrom.value)] : []),
      ...(query.updatedAtTo ? [lt(bookTransaction.updatedAt, query.updatedAtTo.value)] : []),
    );
  }
}
