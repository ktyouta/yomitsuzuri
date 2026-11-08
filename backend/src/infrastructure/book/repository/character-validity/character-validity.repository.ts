import { and, eq, inArray } from "drizzle-orm";
import type { CharacterRelationEntity, ICharacterValidityRepository, UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterTransaction, workTransaction } from "../../../db";

/**
 * 登場人物有効性判定リポジトリ実装
 */
export class CharacterValidityRepository implements ICharacterValidityRepository {
  constructor(private readonly db: Database) { }

  /**
   * 登場人物関係の人物・相手のうち、有効な登場人物を取得する
   * @param userId 書籍を所有するユーザーID
   * @param characterRelation 判定対象の登場人物関係
   * @returns 関係と同じ作品に属する登場人物の ID 一覧（他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みのものは含まない）
   */
  async findCharacters(userId: UserId, characterRelation: CharacterRelationEntity): Promise<{ id: string }[]> {
    const snapshot = characterRelation.toSnapshot();

    return this.db
      .select({
        id: characterTransaction.id,
      })
      .from(characterTransaction)
      // 他ユーザー・論理削除済みの作品や書籍の登場人物を返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(characterTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        inArray(characterTransaction.id, [snapshot.characterId, snapshot.targetCharacterId]),
        eq(characterTransaction.workId, snapshot.workId),
        eq(characterTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));
  }
}
