import type { UserId } from "../../../shared";
import type { CharacterEntity } from "../../entity";
import type { CharacterId } from "../../value-object";

/**
 * 登場人物更新リポジトリインターフェース
 */
export interface IUpdateCharacterRepository {
  /**
   * ユーザーの登場人物を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 登場人物（登場人物が存在しない・他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みの場合は null）
   */
  findCharacter(userId: UserId, characterId: CharacterId): Promise<CharacterEntity | null>;

  /**
   * 登場人物更新
   * @param character 更新後の登場人物
   */
  updateCharacter(character: CharacterEntity): Promise<void>;
}
