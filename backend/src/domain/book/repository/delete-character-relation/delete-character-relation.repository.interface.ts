import type { UserId } from "../../../shared";
import type { CharacterRelationId } from "../../value-object";

/**
 * 登場人物関係削除リポジトリインターフェース
 */
export interface IDeleteCharacterRelationRepository {
  /**
   * ユーザーの登場人物関係を1件物理削除
   * @param userId 書籍を所有するユーザーID
   * @param relationId 登場人物関係ID
   * @returns 削除した場合は true（登場人物関係が存在しない・他ユーザーの書籍の登場人物関係・登場人物関係、作品または書籍が論理削除済みの場合は削除せず false）
   */
  deleteCharacterRelation(userId: UserId, relationId: CharacterRelationId): Promise<boolean>;
}
