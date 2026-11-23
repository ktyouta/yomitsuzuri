import { and, eq, inArray } from "drizzle-orm";
import { CharacterRelationId, UserId, type IHardDeleteCharacterRelationRepository } from "../../../../domain";
import { bookTransaction, characterRelationTransaction, workTransaction, type Database } from "../../../db";

/**
 * 登場人物関係の物理削除リポジトリ実装
 */
export class HardDeleteCharacterRelationRepository implements IHardDeleteCharacterRelationRepository {
  constructor(private readonly db: Database) { }

  /**
   * 登場人物関係の物理削除
   * 指定ユーザーの書籍の、論理削除済みの登場人物関係を物理削除する。
   * 存在しない・他ユーザーの書籍の登場人物関係・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 物理削除の対象の登場人物関係ID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  async deleteCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<boolean> {
    // 指定ユーザーの書籍に収録された作品のID（所有者の確認に使う）
    const userWorkIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(eq(bookTransaction.userId, userId.value));

    // 登場人物関係は配下を持たないため、1文で削除する
    const deleted = await this.db
      .delete(characterRelationTransaction)
      .where(and(
        eq(characterRelationTransaction.id, characterRelationId.value),
        eq(characterRelationTransaction.deleteFlg, true),
        inArray(characterRelationTransaction.workId, userWorkIds),
      ))
      .returning({ id: characterRelationTransaction.id });

    return deleted.length > 0;
  }
}
