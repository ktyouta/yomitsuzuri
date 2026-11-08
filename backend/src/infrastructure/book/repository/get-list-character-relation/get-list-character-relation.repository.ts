import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { CharacterRelationListItem, IGetListCharacterRelationRepository, UserId, WorkId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, characterTransaction, workTransaction } from "../../../db";

// 関係の相手側の登場人物として、同じテーブルをもう一度 JOIN するための別名
const targetCharacterTransaction = alias(characterTransaction, "target_character_transaction");

/**
 * 登場人物関係一覧取得リポジトリ実装
 */
export class GetListCharacterRelationRepository implements IGetListCharacterRelationRepository {
  constructor(private readonly db: Database) { }

  async findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null> {
    const [work] = await this.db
      .select({
        id: workTransaction.id,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(this.buildWorkCondition(userId, workId));

    return work ?? null;
  }

  async findCharacterRelationList(userId: UserId, workId: WorkId): Promise<CharacterRelationListItem[]> {
    return this.db
      .select({
        id: characterRelationTransaction.id,
        characterId: characterRelationTransaction.characterId,
        characterName: characterTransaction.name,
        targetCharacterId: characterRelationTransaction.targetCharacterId,
        targetCharacterName: targetCharacterTransaction.name,
        relationName: characterRelationTransaction.relationName,
      })
      .from(characterRelationTransaction)
      .innerJoin(characterTransaction, eq(characterRelationTransaction.characterId, characterTransaction.id))
      .innerJoin(targetCharacterTransaction, eq(characterRelationTransaction.targetCharacterId, targetCharacterTransaction.id))
      .innerJoin(workTransaction, eq(characterRelationTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        this.buildWorkCondition(userId, workId),
        eq(characterRelationTransaction.deleteFlg, false),
        eq(characterTransaction.deleteFlg, false),
        eq(targetCharacterTransaction.deleteFlg, false)
      ))
      // 関係には sortOrder がないため、ULID の id で登録順に並べる
      .orderBy(asc(characterRelationTransaction.id));
  }

  /**
   * 作品と関係で共通の作品の抽出条件（関係側への所有者条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 指定ユーザーの論理削除されていない書籍に属する、論理削除されていない指定作品を抽出する条件
   */
  private buildWorkCondition(userId: UserId, workId: WorkId) {
    return and(
      eq(workTransaction.id, workId.value),
      eq(workTransaction.deleteFlg, false),
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false)
    );
  }
}
