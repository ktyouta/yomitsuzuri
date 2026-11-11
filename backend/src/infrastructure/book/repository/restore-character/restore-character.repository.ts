import { and, eq } from "drizzle-orm";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, WorkId, type IRestoreCharacterRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterTransaction, workTransaction } from "../../../db";

/**
 * 登場人物復元リポジトリ実装
 */
export class RestoreCharacterRepository implements IRestoreCharacterRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの削除済みの登場人物を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 削除済みの登場人物（登場人物が存在しない・削除されていない・他ユーザーの書籍の登場人物・作品または書籍が論理削除済みの場合は null）
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
        eq(characterTransaction.deleteFlg, true),
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
   * 登場人物の削除状態を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は更新しない。
   * @param character 削除済みを解除した登場人物
   */
  async restoreCharacter(character: CharacterEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = character.toSnapshot();

    await this.db.update(characterTransaction)
      .set({
        deleteFlg: snapshot.deleteFlg,
        updatedAt: now,
      })
      .where(and(
        eq(characterTransaction.id, snapshot.id),
        eq(characterTransaction.deleteFlg, true),
      ));
  }
}
