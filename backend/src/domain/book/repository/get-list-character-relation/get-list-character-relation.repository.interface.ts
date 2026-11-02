import type { UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 登場人物関係一覧の1件分
 */
export type CharacterRelationListItem = {
  id: string;
  characterId: string;
  characterName: string;
  targetCharacterId: string;
  targetCharacterName: string;
  relationName: string;
};

/**
 * 登場人物関係一覧取得リポジトリインターフェース
 */
export interface IGetListCharacterRelationRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 作品の登場人物関係一覧を ID の昇順で取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 関係が属する作品ID
   * @returns 関係と両方の登場人物が論理削除されていない関係の一覧（作品が取得対象外の場合は空配列）
   */
  findCharacterRelationList(userId: UserId, workId: WorkId): Promise<CharacterRelationListItem[]>;
}
