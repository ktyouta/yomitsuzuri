import type { UserId } from "../../../shared";
import type { CharacterRelationId } from "../../value-object";

/**
 * 登場人物関係の物理削除リポジトリインターフェース
 */
export interface IHardDeleteCharacterRelationRepository {
  /**
   * 登場人物関係の物理削除
   * 指定ユーザーの書籍の、論理削除済みの登場人物関係を物理削除する。
   * 存在しない・他ユーザーの書籍の登場人物関係・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 物理削除の対象の登場人物関係ID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  deleteCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<boolean>;
}
