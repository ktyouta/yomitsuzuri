import { and, eq, ne } from "drizzle-orm";
import type { CharacterId, CharacterName, ICharacterNameUniquenessRepository, WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, characterTransaction, workTransaction } from "../../../db";

/**
 * 登場人物名一意性判定リポジトリ実装
 */
export class CharacterNameUniquenessRepository implements ICharacterNameUniquenessRepository {
  constructor(private readonly db: Database) { }

  /**
   * 同名登場人物の取得（同一ユーザーの同一作品内・未削除のもの）
   * characterId 自身は除外する（更新時の自己重複を防ぐ）。
   * @param userId 書籍を所有するユーザーID
   * @param workId 登場人物が属する作品ID
   * @param characterId 判定対象から除外する登場人物ID
   * @param characterName 登場人物名
   * @returns 同名登場人物の ID 一覧
   */
  async findCharacter(userId: UserId, workId: WorkId, characterId: CharacterId, characterName: CharacterName): Promise<{ id: string }[]> {
    const result = await this.db
      .select({
        id: characterTransaction.id,
      })
      .from(characterTransaction)
      // 他ユーザーの作品の登場人物を返さないため、書籍側の所有者で絞り込む
      .innerJoin(workTransaction, eq(characterTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(characterTransaction.deleteFlg, false),
        eq(characterTransaction.workId, workId.value),
        eq(characterTransaction.name, characterName.value),
        ne(characterTransaction.id, characterId.value),
        eq(bookTransaction.userId, userId.value),
      ));

    return result;
  }
}
