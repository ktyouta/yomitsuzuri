import type { CreateSampleEntity } from "../entity";

/**
 * サンプル作成入力型
 */
export type CreateSampleInput = {
  name: string;
  description?: string | null;
};

/**
 * サンプル作成リポジトリインターフェース
 */
export interface ICreateSampleRepository {
  /**
   * 作成
   * @param data 作成データ
   */
  create(data: CreateSampleInput): Promise<CreateSampleEntity>;
}
