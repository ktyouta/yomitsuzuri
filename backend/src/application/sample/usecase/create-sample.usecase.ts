import type { CreateSampleEntity, ICreateSampleRepository } from "../../../domain/sample";

/**
 * サンプル作成ユースケース
 */
export class CreateSampleUsecase {
  constructor(private readonly repository: ICreateSampleRepository) {}

  /**
   * 作成
   * @param name 名前
   * @param description 説明
   */
  async execute(name: string, description?: string): Promise<CreateSampleEntity> {
    return await this.repository.create({
      name,
      description: description ?? null,
    });
  }
}
