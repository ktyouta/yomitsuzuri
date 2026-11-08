import { and, asc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { CharacterDetail, CharacterDetailRelationItem, CharacterId, IGetCharacterRepository, UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterRelationTransaction, characterTransaction, genderMaster, workTransaction } from "../../../db";

// 関係の相手側の登場人物として、同じテーブルをもう一度 JOIN するための別名
const targetCharacterTransaction = alias(characterTransaction, "target_character_transaction");

/**
 * 登場人物詳細取得リポジトリ実装
 */
export class GetCharacterRepository implements IGetCharacterRepository {
  constructor(private readonly db: Database) { }

  async findCharacter(userId: UserId, characterId: CharacterId): Promise<CharacterDetail | null> {
    const [character] = await this.db
      .select({
        id: characterTransaction.id,
        workId: characterTransaction.workId,
        name: characterTransaction.name,
        age: characterTransaction.age,
        genderId: characterTransaction.genderId,
        genderLabel: genderMaster.label,
        occupation: characterTransaction.occupation,
        characteristic: characterTransaction.characteristic,
        memo: characterTransaction.memo,
        updatedAt: characterTransaction.updatedAt,
        deleteFlg: characterTransaction.deleteFlg,
      })
      .from(characterTransaction)
      .innerJoin(workTransaction, eq(characterTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      // 論理削除された性別の表示名を使わせないため、結合条件で除外して null として返す
      .leftJoin(
        genderMaster,
        and(
          eq(characterTransaction.genderId, genderMaster.id),
          eq(genderMaster.deleteFlg, false)
        )
      )
      // 削除済みの登場人物も詳細画面で削除済みとして表示するため、登場人物の削除フラグでは絞り込まない
      .where(and(
        eq(characterTransaction.id, characterId.value),
        this.buildOwnerCondition(userId)
      ));

    return character ?? null;
  }

  async findCharacterRelationList(userId: UserId, characterId: CharacterId): Promise<CharacterDetailRelationItem[]> {
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
        this.buildOwnerCondition(userId),
        // 表示中の登場人物が人物・相手のどちらの関係も表示する
        or(
          eq(characterRelationTransaction.characterId, characterId.value),
          eq(characterRelationTransaction.targetCharacterId, characterId.value)
        ),
        eq(characterRelationTransaction.deleteFlg, false),
        eq(characterTransaction.deleteFlg, false),
        eq(targetCharacterTransaction.deleteFlg, false)
      ))
      // 関係には sortOrder がないため、ULID の id で登録順に並べる
      .orderBy(asc(characterRelationTransaction.id));
  }

  /**
   * 登場人物と関係で共通の所有者の抽出条件（関係側への所有者条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @returns 指定ユーザーの論理削除されていない書籍と作品を抽出する条件
   */
  private buildOwnerCondition(userId: UserId) {
    return and(
      eq(workTransaction.deleteFlg, false),
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false)
    );
  }
}
