import { and, eq, inArray } from "drizzle-orm";
import type { CharacterRelationId, IDeleteCharacterRelationRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, workTransaction } from "../../../db";

/**
 * 登場人物関係削除リポジトリ実装
 */
export class DeleteCharacterRelationRepository implements IDeleteCharacterRelationRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの登場人物関係を1件物理削除
   * @param userId 書籍を所有するユーザーID
   * @param relationId 登場人物関係ID
   * @returns 削除した場合は true（登場人物関係が存在しない・他ユーザーの書籍の登場人物関係・登場人物関係、作品または書籍が論理削除済みの場合は削除せず false）
   */
  async deleteCharacterRelation(userId: UserId, relationId: CharacterRelationId): Promise<boolean> {
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

    const deleted = await this.db.delete(characterRelationTransaction)
      .where(and(
        eq(characterRelationTransaction.id, relationId.value),
        eq(characterRelationTransaction.deleteFlg, false),
        inArray(characterRelationTransaction.workId, workIds),
      ))
      .returning({ id: characterRelationTransaction.id });

    return deleted.length > 0;
  }
}
