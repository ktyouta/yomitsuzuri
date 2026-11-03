import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { CharacterRelationId } from "../../value-object";

/**
 * 登場人物関係更新リポジトリインターフェース
 */
export interface IUpdateCharacterRelationRepository {
  /**
   * ユーザーの登場人物関係を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 登場人物関係ID
   * @returns 登場人物関係（登場人物関係が存在しない・他ユーザーの書籍の登場人物関係・登場人物関係、人物、相手、作品または書籍が論理削除済みの場合は null）
   */
  findCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<CharacterRelationEntity | null>;

  /**
   * 登場人物関係更新
   * @param characterRelation 更新後の登場人物関係
   */
  updateCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void>;
}
