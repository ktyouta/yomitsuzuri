import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { CharacterRelationId } from "../../value-object";

/**
 * 登場人物関係削除リポジトリインターフェース
 */
export interface IDeleteCharacterRelationRepository {
  /**
   * ユーザーの登場人物関係を1件取得（人物・相手の削除状態は問わない）
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 登場人物関係ID
   * @returns 登場人物関係（登場人物関係が存在しない・他ユーザーの書籍の登場人物関係・登場人物関係、作品または書籍が論理削除済みの場合は null）
   */
  findCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<CharacterRelationEntity | null>;

  /**
   * 登場人物関係の削除状態を保存（論理削除）
   * @param characterRelation 削除済みにした登場人物関係
   */
  deleteCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void>;
}
