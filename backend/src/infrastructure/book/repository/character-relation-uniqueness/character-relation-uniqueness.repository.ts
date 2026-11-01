import { and, eq, ne, or } from "drizzle-orm";
import type { CharacterRelationEntity, ICharacterRelationUniquenessRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, workTransaction } from "../../../db";

/**
 * 登場人物関係一意性判定リポジトリ実装
 */
export class CharacterRelationUniquenessRepository implements ICharacterRelationUniquenessRepository {
  constructor(private readonly db: Database) { }

  /**
   * 重複する登場人物関係の取得（同一ユーザーの同一作品内・未削除のもの）
   * 同じ2人の間（人物と相手が逆向きのものを含む）で、関係名が同じものを返す。
   * 判定対象の関係自身は除外する（更新時の自己重複を防ぐ）。
   * @param userId 書籍を所有するユーザーID
   * @param characterRelation 判定対象の登場人物関係
   * @returns 重複する登場人物関係の ID 一覧
   */
  async findCharacterRelation(userId: UserId, characterRelation: CharacterRelationEntity): Promise<{ id: string }[]> {
    const snapshot = characterRelation.toSnapshot();
    const result = await this.db
      .select({
        id: characterRelationTransaction.id,
      })
      .from(characterRelationTransaction)
      // 他ユーザーの作品の登場人物関係を返さないため、書籍側の所有者で絞り込む
      .innerJoin(workTransaction, eq(characterRelationTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(characterRelationTransaction.deleteFlg, false),
        eq(characterRelationTransaction.workId, snapshot.workId),
        ne(characterRelationTransaction.id, snapshot.id),
        // 向きを問わず同じ2人の関係を対象にする
        or(
          and(
            eq(characterRelationTransaction.characterId, snapshot.characterId),
            eq(characterRelationTransaction.targetCharacterId, snapshot.targetCharacterId),
          ),
          and(
            eq(characterRelationTransaction.characterId, snapshot.targetCharacterId),
            eq(characterRelationTransaction.targetCharacterId, snapshot.characterId),
          ),
        ),
        eq(characterRelationTransaction.relationName, snapshot.relationName),
        eq(bookTransaction.userId, userId.value),
      ));

    return result;
  }
}
