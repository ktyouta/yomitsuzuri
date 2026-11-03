import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";

/**
 * 登場人物有効性判定リポジトリインターフェース
 */
export interface ICharacterValidityRepository {
  /**
   * 登場人物関係の人物・相手のうち、有効な登場人物を取得する
   * @param userId 書籍を所有するユーザーID
   * @param characterRelation 判定対象の登場人物関係
   * @returns 関係と同じ作品に属する登場人物の ID 一覧（他ユーザーの書籍の登場人物・登場人物、作品または書籍が論理削除済みのものは含まない）
   */
  findCharacters(userId: UserId, characterRelation: CharacterRelationEntity): Promise<{ id: string }[]>;
}
