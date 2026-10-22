import type { GenderId } from "../../value-object";

/**
 * 性別有効性判定リポジトリインターフェース
 */
export interface IGenderValidityRepository {
  /**
   * 指定した性別が gender_master に存在し、有効（未削除）かを判定する
   * @param genderId 性別ID（未入力（null）でないこと）
   * @returns 存在し未削除の場合 true
   * @throws 性別IDが未入力（null）の場合
   */
  exists(genderId: GenderId): Promise<boolean>;
}
