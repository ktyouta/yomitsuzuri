import type { UpdateSampleEntity, IUpdateSampleRepository } from "../../../domain/sample";

/**
 * サンプル更新ユースケース
 */
export class UpdateSampleUsecase {
  constructor(private readonly repository: IUpdateSampleRepository) {}

  /**
   * 更新
   * @param id サンプルID
   * @param name 名前
   * @param description 説明
   */
  async execute(
    id: number,
    name?: string,
    description?: string
  ): Promise<UpdateSampleEntity | null> {
    const updateData: { name?: string; description?: string } = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const entity = await this.repository.update(id, updateData);
    return entity ?? null;
  }
}
