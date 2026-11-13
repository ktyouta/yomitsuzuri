import { and, eq } from "drizzle-orm";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, WorkId, type IRestoreCharacterRelationRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, workTransaction } from "../../../db";

/**
 * 登場人物関係復元リポジトリ実装
 */
export class RestoreCharacterRelationRepository implements IRestoreCharacterRelationRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの削除済みの登場人物関係を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 登場人物関係ID
   * @returns 削除済みの登場人物関係（登場人物関係が存在しない・削除されていない・他ユーザーの書籍の登場人物関係・作品または書籍が論理削除済みの場合は null）
   */
  async findCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<CharacterRelationEntity | null> {
    const [relation] = await this.db
      .select({
        id: characterRelationTransaction.id,
        workId: characterRelationTransaction.workId,
        characterId: characterRelationTransaction.characterId,
        targetCharacterId: characterRelationTransaction.targetCharacterId,
        relationName: characterRelationTransaction.relationName,
        deleteFlg: characterRelationTransaction.deleteFlg,
      })
      .from(characterRelationTransaction)
      // 他ユーザー・論理削除済みの作品や書籍の登場人物関係を返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(characterRelationTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(characterRelationTransaction.id, characterRelationId.value),
        eq(characterRelationTransaction.deleteFlg, true),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    if (!relation) {
      return null;
    }

    return CharacterRelationEntity.reconstruct({
      id: CharacterRelationId.of(relation.id),
      workId: WorkId.of(relation.workId),
      characterId: CharacterId.of(relation.characterId),
      targetCharacterId: CharacterId.of(relation.targetCharacterId),
      relationName: CharacterRelationName.of(relation.relationName),
      deleteFlg: relation.deleteFlg,
    });
  }

  /**
   * 登場人物関係の削除状態を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は更新しない。
   * @param characterRelation 削除済みを解除した登場人物関係
   */
  async restoreCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = characterRelation.toSnapshot();

    await this.db.update(characterRelationTransaction)
      .set({
        deleteFlg: snapshot.deleteFlg,
        updatedAt: now,
      })
      .where(and(
        eq(characterRelationTransaction.id, snapshot.id),
        eq(characterRelationTransaction.deleteFlg, true),
      ));
  }
}
