import { and, eq, inArray } from "drizzle-orm";
import { UserId, WordId, type IHardDeleteWordRepository } from "../../../../domain";
import { bookTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 気になるワードの物理削除リポジトリ実装
 */
export class HardDeleteWordRepository implements IHardDeleteWordRepository {
  constructor(private readonly db: Database) { }

  /**
   * 気になるワードの物理削除
   * 指定ユーザーの書籍の、論理削除済みの気になるワードを物理削除する。
   * 存在しない・他ユーザーの書籍の気になるワード・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param wordId 物理削除の対象の気になるワードID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  async deleteWord(userId: UserId, wordId: WordId): Promise<boolean> {
    // 指定ユーザーの書籍に収録された作品のID（所有者の確認に使う）
    const userWorkIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(eq(bookTransaction.userId, userId.value));

    // 気になるワードは配下を持たないため、1文で削除する
    const deleted = await this.db
      .delete(wordTransaction)
      .where(and(
        eq(wordTransaction.id, wordId.value),
        eq(wordTransaction.deleteFlg, true),
        inArray(wordTransaction.workId, userWorkIds),
      ))
      .returning({ id: wordTransaction.id });

    return deleted.length > 0;
  }
}
