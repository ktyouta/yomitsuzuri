import { and, eq } from "drizzle-orm";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, WorkId, type IDeleteCharacterRelationRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, workTransaction } from "../../../db";

/**
 * 登場人物関係削除リポジトリ実装
 */
export class DeleteCharacterRelationRepository implements IDeleteCharacterRelationRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの登場人物関係を1件取得（人物・相手の削除状態は問わない）
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 登場人物関係ID
   * @returns 登場人物関係（登場人物関係が存在しない・他ユーザーの書籍の登場人物関係・登場人物関係、作品または書籍が論理削除済みの場合は null）
   */
  async findCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<CharacterRelationEntity | null> {
    const [characterRelation] = await this.db
      .select({
        id: characterRelationTransaction.id,
        workId: characterRelationTransaction.workId,
        characterId: characterRelationTransaction.characterId,
        targetCharacterId: characterRelationTransaction.targetCharacterId,
        relationName: characterRelationTransaction.relationName,
        deleteFlg: characterRelationTransaction.deleteFlg,
      })
      .from(characterRelationTransaction)
      // 他ユーザー・論理削除済みの作品や書籍の関係を返さないため、作品・書籍側の条件で絞り込む
      // 人物が論理削除された関係も削除できるよう、登場人物とは JOIN しない
      .innerJoin(workTransaction, eq(characterRelationTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(characterRelationTransaction.id, characterRelationId.value),
        eq(characterRelationTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    if (!characterRelation) {
      return null;
    }

    return CharacterRelationEntity.reconstruct({
      id: CharacterRelationId.of(characterRelation.id),
      workId: WorkId.of(characterRelation.workId),
      characterId: CharacterId.of(characterRelation.characterId),
      targetCharacterId: CharacterId.of(characterRelation.targetCharacterId),
      relationName: CharacterRelationName.of(characterRelation.relationName),
      deleteFlg: characterRelation.deleteFlg,
    });
  }

  /**
   * 登場人物関係の削除状態を保存（論理削除）
   * @param characterRelation 削除済みにした登場人物関係
   */
  async deleteCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = characterRelation.toSnapshot();

    await this.db.update(characterRelationTransaction)
      .set({
        deleteFlg: snapshot.deleteFlg,
        updatedAt: now,
      })
      .where(and(
        eq(characterRelationTransaction.id, snapshot.id),
        eq(characterRelationTransaction.deleteFlg, false),
      ));
  }
}
