import type { IconId } from "../../value-object";

/**
 * アイコン有効性判定リポジトリインターフェース
 */
export interface IIconValidityRepository {
  /**
   * 指定したアイコンのうち、icon_master に存在し有効（未削除）なものの ID を取得する
   * @param iconIds アイコンID（重複なし）
   * @returns 存在し未削除のアイコンの ID
   */
  findValidIds(iconIds: IconId[]): Promise<number[]>;
}
