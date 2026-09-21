import type { GetSampleEntity, IGetSampleRepository } from "../../../domain/sample";

/**
 * サンプル取得ユースケース
 */
export class GetSampleUsecase {
  constructor(private readonly repository: IGetSampleRepository) { }

  /**
   * ID指定で取得
   * @param id サンプルID
   */
  async execute(id: number): Promise<GetSampleEntity | null> {
    const entity = await this.repository.findById(id);
    return entity ?? null;
  }
}
