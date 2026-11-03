import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, WorkId, type IUpdateCharacterRelationRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, characterTransaction, workTransaction } from "../../../db";

// 関係の相手側の登場人物として、同じテーブルをもう一度 JOIN するための別名
const targetCharacterTransaction = alias(characterTransaction, "target_character_transaction");

/**
 * 登場人物関係更新リポジトリ実装
 */
export class UpdateCharacterRelationRepository implements IUpdateCharacterRelationRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの登場人物関係を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 登場人物関係ID
   * @returns 登場人物関係（登場人物関係が存在しない・他ユーザーの書籍の登場人物関係・登場人物関係、人物、相手、作品または書籍が論理削除済みの場合は null）
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
      .innerJoin(characterTransaction, eq(characterRelationTransaction.characterId, characterTransaction.id))
      .innerJoin(targetCharacterTransaction, eq(characterRelationTransaction.targetCharacterId, targetCharacterTransaction.id))
      .innerJoin(workTransaction, eq(characterRelationTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(characterRelationTransaction.id, characterRelationId.value),
        eq(characterRelationTransaction.deleteFlg, false),
        // 一覧で除外している、人物または相手が論理削除された関係は更新の対象にしない
        eq(characterTransaction.deleteFlg, false),
        eq(targetCharacterTransaction.deleteFlg, false),
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
   * 登場人物関係更新
   * @param characterRelation 更新後の登場人物関係
   */
  async updateCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = characterRelation.toSnapshot();

    await this.db.update(characterRelationTransaction)
      .set({
        characterId: snapshot.characterId,
        targetCharacterId: snapshot.targetCharacterId,
        relationName: snapshot.relationName,
        updatedAt: now,
      })
      .where(and(
        eq(characterRelationTransaction.id, snapshot.id),
        eq(characterRelationTransaction.deleteFlg, false),
      ));
  }
}
