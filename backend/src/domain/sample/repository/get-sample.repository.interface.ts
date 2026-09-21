import type { GetSampleEntity } from "../entity";

/**
 * サンプル取得リポジトリインターフェース
 */
export interface IGetSampleRepository {
  /**
   * ID指定で取得
   * @param id サンプルID
   */
  findById(id: number): Promise<GetSampleEntity | undefined>;
}
