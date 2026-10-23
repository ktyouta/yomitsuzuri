import { and, eq } from "drizzle-orm";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId, type IUpdateCharacterRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, characterTransaction, workTransaction } from "../../../db";

/**
 * 登場人物更新リポジトリ実装
 */
export class UpdateCharacterRepository implements IUpdateCharacterRepository {

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
   * 登場人物更新
   * @param character 更新後の登場人物
   */
  async updateCharacter(character: CharacterEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = character.toSnapshot();

    await this.db.update(characterTransaction)
      .set({
        name: snapshot.name,
        age: snapshot.age,
        genderId: snapshot.genderId,
        occupation: snapshot.occupation,
        characteristic: snapshot.characteristic,
        memo: snapshot.memo,
        updatedAt: now,
      })
      .where(and(
        eq(characterTransaction.id, snapshot.id),
        eq(characterTransaction.deleteFlg, false),
      ));
  }
}
