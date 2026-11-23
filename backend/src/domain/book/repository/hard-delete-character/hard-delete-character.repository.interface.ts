import type { UserId } from "../../../shared";
import type { CharacterId } from "../../value-object";

/**
 * 登場人物の物理削除リポジトリインターフェース
 */
export interface IHardDeleteCharacterRepository {
  /**
   * 登場人物の物理削除
   * 指定ユーザーの書籍の、論理削除済みの登場人物と、登場人物が人物または相手として関わる人物関係（削除フラグに関係なくすべて）を物理削除する。
   * すべて削除するか、何も削除しないかのどちらかにする（参照先のない人物関係を残さないため）。
   * 存在しない・他ユーザーの書籍の登場人物・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param characterId 物理削除の対象の登場人物ID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  deleteCharacter(userId: UserId, characterId: CharacterId): Promise<boolean>;
}
