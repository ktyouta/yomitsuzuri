import { and, count, desc, eq, sql } from "drizzle-orm";
import { BookId } from "../../../domain/book";
import type { BookListPageResult, BookListPagination, IGetListBookRepository } from "../../../domain/book";
import type { UserId } from "../../../domain/user";
import type { Database } from "../../db";
import { bookTransaction, iconMaster, readingStatusMaster, workTransaction } from "../../db";

/**
 * 書籍一覧取得リポジトリ実装
 */
export class GetListBookRepository implements IGetListBookRepository {
  constructor(private readonly db: Database) { }

  async findList(userId: UserId, pagination: BookListPagination): Promise<BookListPageResult> {
    const condition = and(
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false)
    );

    // 一覧と全件数を同一時点のデータから取得するため batch で実行する
    const [rows, [countResult]] = await this.db.batch([
      this.db
        .select({
          id: bookTransaction.id,
          title: bookTransaction.title,
          updatedAt: bookTransaction.updatedAt,
          readingStatus: bookTransaction.readingStatus,
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
            eq(bookTransaction.readingStatus, readingStatusMaster.code),
            eq(readingStatusMaster.deleteFlg, false)
          )
        )
        // 論理削除されたアイコンは null として返し、表示側でデフォルトアイコンに差し替える
        .leftJoin(
          iconMaster,
          and(
            eq(bookTransaction.icon, iconMaster.id),
            eq(iconMaster.deleteFlg, false)
          )
        )
        .where(condition)
        // 更新日時が同じ書籍の順序をページ間で固定するため id を第2キーにする
        .orderBy(desc(bookTransaction.updatedAt), desc(bookTransaction.id))
        .limit(pagination.limit)
        .offset(pagination.offset),
      this.db
        .select({ total: count() })
        .from(bookTransaction)
        .where(condition),
    ]);

    const list = rows.map((row) => ({ ...row, id: BookId.of(row.id) }));

    return { list, total: countResult?.total ?? 0 };
  }
}
