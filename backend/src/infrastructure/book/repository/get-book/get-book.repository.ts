import { and, asc, eq } from "drizzle-orm";
import type { BookId, BookItem, IGetBookRepository, UserId, WorkItem } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, iconMaster, readingStatusMaster, workTransaction } from "../../../db";

/**
 * 書籍詳細取得リポジトリ実装
 */
export class GetBookRepository implements IGetBookRepository {
  constructor(private readonly db: Database) { }

  async findBook(userId: UserId, bookId: BookId): Promise<BookItem | null> {
    const [book] = await this.db
      .select({
        id: bookTransaction.id,
        title: bookTransaction.title,
        publishedDate: bookTransaction.publishedDate,
        readingStatusId: bookTransaction.readingStatusId,
        readingStatusLabel: readingStatusMaster.label,
        currentPage: bookTransaction.currentPage,
        memo: bookTransaction.memo,
        iconId: bookTransaction.iconId,
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

  async findWork(userId: UserId, bookId: BookId): Promise<WorkItem[]> {
    return this.db
      .select({
        id: workTransaction.id,
        title: workTransaction.title,
        sort: workTransaction.sortOrder,
        memo: workTransaction.memo,
        iconId: workTransaction.iconId,
        icon: iconMaster.emoji,
        deleteFlg: workTransaction.deleteFlg,
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
      // 削除済みの作品も画面で削除済みとして表示するため、作品の削除フラグでは絞り込まない
      .where(this.buildBookCondition(userId, bookId))
      // 削除済みを末尾にするため削除フラグを第1キーにする（docs/delete-restore/plan.md の U12）
      // 削除済み同士は表示順が NULL で並ぶことがあり、表示順には一意制約もないため、順序を固定するよう id を最後のキーにする
      .orderBy(asc(workTransaction.deleteFlg), asc(workTransaction.sortOrder), asc(workTransaction.id));
  }

  /**
   * 書籍と作品で共通の書籍の抽出条件（作品側への所有者条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 指定ユーザーの論理削除されていない指定書籍を抽出する条件
   */
  private buildBookCondition(userId: UserId, bookId: BookId) {
    return and(
      eq(bookTransaction.id, bookId.value),
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false)
    );
  }
}
