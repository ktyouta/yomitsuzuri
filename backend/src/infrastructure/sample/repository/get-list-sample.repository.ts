import { eq } from "drizzle-orm";
import { GetListSampleEntity } from "../../../domain/sample";
import type { IGetListSampleRepository } from "../../../domain/sample";
import type { Database } from "../../db";
import { sample } from "../../db";

/**
 * サンプル一覧取得リポジトリ実装
 */
export class GetListSampleRepository implements IGetListSampleRepository {
  constructor(private readonly db: Database) { }

  /**
   * 全件取得（論理削除されていないもの）
   */
  async findAll(): Promise<GetListSampleEntity[]> {
    const result = await this.db
      .select()
      .from(sample)
      .where(eq(sample.deleteFlg, false));
    return result.map((record) => GetListSampleEntity.fromRecord(record));
  }
}
