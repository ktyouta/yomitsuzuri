import { and, eq } from "drizzle-orm";
import { GetSampleEntity } from "../../../domain/sample";
import type { IGetSampleRepository } from "../../../domain/sample";
import type { Database } from "../../db";
import { sample } from "../../db";

/**
 * サンプル取得リポジトリ実装
 */
export class GetSampleRepository implements IGetSampleRepository {
  constructor(private readonly db: Database) { }

  /**
   * ID指定で取得
   */
  async findById(id: number): Promise<GetSampleEntity | undefined> {
    const result = await this.db
      .select()
      .from(sample)
      .where(and(eq(sample.id, id), eq(sample.deleteFlg, false)));
    return result[0] ? GetSampleEntity.fromRecord(result[0]) : undefined;
  }
}
