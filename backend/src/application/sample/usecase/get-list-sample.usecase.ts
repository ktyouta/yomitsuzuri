import type { GetListSampleEntity, IGetListSampleRepository } from "../../../domain/sample";

/**
 * サンプル一覧取得ユースケース
 */
export class GetListSampleUsecase {
  constructor(private readonly repository: IGetListSampleRepository) { }

  /**
   * 全件取得
   */
  async execute(): Promise<GetListSampleEntity[]> {
    return await this.repository.findAll();
  }
}
