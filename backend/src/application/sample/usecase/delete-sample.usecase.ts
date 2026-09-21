import type { IDeleteSampleRepository } from "../../../domain/sample";

/**
 * サンプル削除ユースケース
 */
export class DeleteSampleUsecase {
  constructor(private readonly repository: IDeleteSampleRepository) {}

  /**
   * 削除
   * @param id サンプルID
   */
  async execute(id: number): Promise<boolean> {
    return await this.repository.delete(id);
  }
}
