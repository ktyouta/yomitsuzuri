import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { WorkId } from "../../value-object";

/**
 * 登場人物関係作成リポジトリインターフェース
 */
export interface ICreateCharacterRelationRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 登場人物関係作成
   * @param characterRelation 作成する登場人物関係
   */
  createCharacterRelation(characterRelation: CharacterRelationEntity): Promise<void>;
}
