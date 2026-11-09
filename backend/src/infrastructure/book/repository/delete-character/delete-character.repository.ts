import { and, eq, or } from "drizzle-orm";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId, type IDeleteCharacterRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, characterTransaction, workTransaction } from "../../../db";

/**
 * 登場人物削除リポジトリ実装
 */
export class DeleteCharacterRepository implements IDeleteCharacterRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの登場人物を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 登場人物（登場人物が存在しない・他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みの場合は null）
   */
  async findCharacter(userId: UserId, characterId: CharacterId): Promise<CharacterEntity | null> {
    const [character] = await this.db
      .select({
        id: characterTransaction.id,
        workId: characterTransaction.workId,
        name: characterTransaction.name,
        age: characterTransaction.age,
        genderId: characterTransaction.genderId,
        occupation: characterTransaction.occupation,
        characteristic: characterTransaction.characteristic,
        memo: characterTransaction.memo,
        deleteFlg: characterTransaction.deleteFlg,
      })
      .from(characterTransaction)
      // 他ユーザー・論理削除済みの作品や書籍の登場人物を返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(characterTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(characterTransaction.id, characterId.value),
        eq(characterTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    if (!character) {
      return null;
    }

    return CharacterEntity.reconstruct({
      id: CharacterId.of(character.id),
      workId: WorkId.of(character.workId),
      name: CharacterName.of(character.name),
      age: CharacterAge.of(character.age),
      genderId: GenderId.of(character.genderId),
      occupation: CharacterOccupation.of(character.occupation),
      characteristic: CharacterCharacteristic.of(character.characteristic),
      memo: CharacterMemo.of(character.memo),
      deleteFlg: character.deleteFlg,
    });
  }

  /**
   * 登場人物が人物または相手として関わる、削除されていない人物関係を取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 人物関係の ID の一覧（他ユーザーの書籍の人物関係・作品または書籍が論理削除済みの場合は含まない）
   */
  async findCharacterRelationList(userId: UserId, characterId: CharacterId): Promise<{ id: string; }[]> {
    return this.db
      .select({
        id: characterRelationTransaction.id,
      })
      .from(characterRelationTransaction)
      .innerJoin(workTransaction, eq(characterRelationTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        or(
          eq(characterRelationTransaction.characterId, characterId.value),
          eq(characterRelationTransaction.targetCharacterId, characterId.value),
        ),
        eq(characterRelationTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false)
      ))
  }

  /**
   * 登場人物の削除状態を保存（論理削除）
   * @param character 削除済みにした登場人物
   */
  async deleteCharacter(character: CharacterEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = character.toSnapshot();

    await this.db.update(characterTransaction)
      .set({
        deleteFlg: snapshot.deleteFlg,
        updatedAt: now,
      })
      .where(and(
        eq(characterTransaction.id, snapshot.id),
        eq(characterTransaction.deleteFlg, false),
      ));
  }
}
