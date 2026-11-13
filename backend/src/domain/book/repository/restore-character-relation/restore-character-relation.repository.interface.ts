import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { CharacterRelationId } from "../../value-object";

/**
 * 登場人物関係復元リポジトリインターフェース
 */
export interface IRestoreCharacterRelationRepository {
  /**
   * ユーザーの削除済みの登場人物関係を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param characterRelationId 登場人物関係ID
   * @returns 削除済みの登場人物関係（登場人物関係が存在しない・削除されていない・他ユーザーの書籍の登場人物関係・作品または書籍が論理削除済みの場合は null）
   */
  findCharacterRelation(userId: UserId, characterRelationId: CharacterRelationId): Promise<CharacterRelationEntity | null>;

  /**
   * 登場人物関係の削除状態を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は何もしない。
   * @param characterRelation 削除済みを解除した登場人物関係
   */
  restoreCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void>;
}
