import type { UserId } from "../../../shared";
import type { CharacterEntity } from "../../entity";
import type { CharacterId } from "../../value-object";

/**
 * 登場人物削除リポジトリインターフェース
 */
export interface IDeleteCharacterRepository {
  /**
   * ユーザーの登場人物を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 登場人物（登場人物が存在しない・他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みの場合は null）
   */
  findCharacter(userId: UserId, characterId: CharacterId): Promise<CharacterEntity | null>;

  /**
   * 登場人物が人物または相手として関わる、削除されていない人物関係を取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 人物関係の ID の一覧（他ユーザーの書籍の人物関係・作品または書籍が論理削除済みの場合は含まない）
   */
  findCharacterRelationList(userId: UserId, characterId: CharacterId): Promise<{ id: string; }[]>;

  /**
   * 登場人物の削除状態を保存（論理削除）
   * @param character 削除済みにした登場人物
   */
  deleteCharacter(character: CharacterEntity): Promise<void>;
}
