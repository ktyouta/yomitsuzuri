import { and, eq, inArray } from "drizzle-orm";
import type { IDeleteWordRepository, WordId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード削除リポジトリ実装
 */
export class DeleteWordRepository implements IDeleteWordRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの気になるワードを1件物理削除
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 削除した場合は true（気になるワードが存在しない・他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みの場合は削除せず false）
   */
  async deleteWord(userId: UserId, wordId: WordId): Promise<boolean> {
    // SQLite の DELETE は JOIN できないため、他ユーザー・論理削除済みの作品や書籍の条件はサブクエリで付ける
    const workIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    const deleted = await this.db.delete(wordTransaction)
      .where(and(
        eq(wordTransaction.id, wordId.value),
        eq(wordTransaction.deleteFlg, false),
        inArray(wordTransaction.workId, workIds),
      ))
      .returning({ id: wordTransaction.id });

    return deleted.length > 0;
  }
}
