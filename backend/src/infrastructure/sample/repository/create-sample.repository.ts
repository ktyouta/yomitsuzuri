import { CreateSampleEntity } from "../../../domain/sample";
import type { CreateSampleInput, ICreateSampleRepository } from "../../../domain/sample";
import type { Database } from "../../db";
import { sample } from "../../db";

/**
 * サンプル作成リポジトリ実装
 */
export class CreateSampleRepository implements ICreateSampleRepository {
  constructor(private readonly db: Database) {}

  /**
   * 作成
   */
  async create(data: CreateSampleInput): Promise<CreateSampleEntity> {
    const now = new Date().toISOString();
    const result = await this.db
      .insert(sample)
      .values({
        name: data.name,
        description: data.description ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return CreateSampleEntity.fromRecord(result[0]);
  }
}
