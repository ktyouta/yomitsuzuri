import type { IconId } from "../../value-object";

/**
 * アイコン有効性判定リポジトリインターフェース
 */
export interface IIconValidityRepository {
  /**
   * 指定したアイコンが icon_master に存在し、有効（未削除）かを判定する
   * @param iconId アイコンID
   * @returns 存在し未削除の場合 true
   */
  exists(iconId: IconId): Promise<boolean>;
}
