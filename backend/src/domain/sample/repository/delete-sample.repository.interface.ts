/**
 * サンプル削除リポジトリインターフェース
 */
export interface IDeleteSampleRepository {
  /**
   * 削除（論理削除）
   * @param id サンプルID
   */
  delete(id: number): Promise<boolean>;
}
