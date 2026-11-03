import { and, eq } from "drizzle-orm";
import type { CharacterRelationEntity, ICreateCharacterRelationRepository, UserId, WorkId } from "../../../../domain";
import { bookTransaction, characterRelationTransaction, workTransaction, type Database } from "../../../db";

/**
 * 登場人物関係作成リポジトリ実装
 */
export class CreateCharacterRelationRepository implements ICreateCharacterRelationRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  async findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null> {
    const [work] = await this.db
      .select({
        id: workTransaction.id,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.id, workId.value),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    return work ?? null;
  }

  /**
   * 登場人物関係作成
   * @param characterRelation 作成する登場人物関係
   */
  async createCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = characterRelation.toSnapshot();

    await this.db.insert(characterRelationTransaction).values({
      id: snapshot.id,
      workId: snapshot.workId,
      characterId: snapshot.characterId,
      targetCharacterId: snapshot.targetCharacterId,
      relationName: snapshot.relationName,
      deleteFlg: snapshot.deleteFlg,
      createdAt: now,
      updatedAt: now,
    });
  }
}
