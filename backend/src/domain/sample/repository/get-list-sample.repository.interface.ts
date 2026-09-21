import type { GetListSampleEntity } from "../entity";

/**
 * サンプル一覧取得リポジトリインターフェース
 */
export interface IGetListSampleRepository {
  /**
   * 全件取得
   */
  findAll(): Promise<GetListSampleEntity[]>;
}
