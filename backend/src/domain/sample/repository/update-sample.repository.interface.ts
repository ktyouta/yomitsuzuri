import type { UpdateSampleEntity } from "../entity";

/**
 * サンプル更新入力型
 */
export type UpdateSampleInput = {
  name?: string;
  description?: string;
};

/**
 * サンプル更新リポジトリインターフェース
 */
export interface IUpdateSampleRepository {
  /**
   * 更新
   * @param id サンプルID
   * @param data 更新データ
   */
  update(id: number, data: UpdateSampleInput): Promise<UpdateSampleEntity | undefined>;
}
