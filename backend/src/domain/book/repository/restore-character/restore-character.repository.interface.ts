import type { UserId } from "../../../shared";
import type { CharacterEntity } from "../../entity";
import type { CharacterId } from "../../value-object";

/**
 * 登場人物復元リポジトリインターフェース
 */
export interface IRestoreCharacterRepository {
  /**
   * ユーザーの削除済みの登場人物を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterId 登場人物ID
   * @returns 削除済みの登場人物（登場人物が存在しない・削除されていない・他ユーザーの書籍の登場人物・作品または書籍が論理削除済みの場合は null）
   */
  findCharacter(userId: UserId, characterId: CharacterId): Promise<CharacterEntity | null>;

  /**
   * 登場人物の削除状態を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は何もしない。
   * @param character 削除済みを解除した登場人物
   */
  restoreCharacter(character: CharacterEntity): Promise<void>;
}
