import { and, asc, eq, sql } from "drizzle-orm";
import type { AuthorItem, BookId, DeletedBookItem, DeletedBookWorkItem, IGetDeletedBookRepository, UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { authorTransaction, bookTransaction, iconMaster, readingStatusMaster, workTransaction } from "../../../db";

/**
 * 削除済みの書籍詳細取得リポジトリ実装
 */
export class GetDeletedBookRepository implements IGetDeletedBookRepository {
  constructor(private readonly db: Database) { }

  async findDeletedBook(userId: UserId, bookId: BookId): Promise<DeletedBookItem | null> {
    const [book] = await this.db
      .select({
        id: bookTransaction.id,
        title: bookTransaction.title,
        publishedDate: bookTransaction.publishedDate,
        readingStatusId: bookTransaction.readingStatusId,
        readingStatusLabel: readingStatusMaster.label,
        currentPage: bookTransaction.currentPage,
        memo: bookTransaction.memo,
        icon: iconMaster.emoji,
        updatedAt: bookTransaction.updatedAt,
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
      .where(this.buildBookCondition(userId, bookId));

    return book ?? null;
  }

  async findDeletedBookWork(userId: UserId, bookId: BookId): Promise<DeletedBookWorkItem[]> {
    return this.db
      .select({
        id: workTransaction.id,
        title: workTransaction.title,
        memo: workTransaction.memo,
        icon: iconMaster.emoji,
      })
      .from(workTransaction)
      // 他ユーザー・削除されていない書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      // 論理削除されたアイコンは null として返し、表示側でデフォルトアイコンに差し替える
      .leftJoin(
        iconMaster,
        and(
          eq(workTransaction.iconId, iconMaster.id),
          eq(iconMaster.deleteFlg, false)
        )
      )
      // 書籍の復元で作品もすべて戻るため、作品の削除フラグでは絞り込まない
      .where(this.buildBookCondition(userId, bookId))
      // 書籍の復元後の並びに合わせ、表示順が null の作品（個別に削除していた作品）を ID 順に末尾にする（docs/delete-restore/plan.md の U13）。
      // SQLite の昇順では null が先頭になるため nulls last を指定する。表示順には一意制約がないため、順序を固定するよう id を第2キーにする
      .orderBy(sql`${workTransaction.sortOrder} asc nulls last`, asc(workTransaction.id));
  }

  async findDeletedBookAuthor(userId: UserId, bookId: BookId): Promise<AuthorItem[]> {
    return this.db
      .select({
        name: authorTransaction.name,
      })
      .from(authorTransaction)
      // 他ユーザー・削除されていない書籍の著者を返さないため、書籍側の条件で絞り込む（書籍の復元で著者もすべて戻るため、著者の削除フラグでは絞り込まない）
      .innerJoin(bookTransaction, eq(authorTransaction.bookId, bookTransaction.id))
      .where(this.buildBookCondition(userId, bookId))
      .orderBy(asc(authorTransaction.sortOrder), asc(authorTransaction.id));
  }

  /**
   * 書籍・作品・著者で共通の書籍の抽出条件（作品・著者側への所有者条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 指定ユーザーの論理削除済みの指定書籍を抽出する条件
   */
  private buildBookCondition(userId: UserId, bookId: BookId) {
    return and(
      eq(bookTransaction.id, bookId.value),
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, true)
    );
  }
}
