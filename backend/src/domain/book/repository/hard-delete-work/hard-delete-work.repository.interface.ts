import type { Timestamp, UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 作品の物理削除リポジトリインターフェース
 */
export interface IHardDeleteWorkRepository {
  /**
   * 物理削除の対象の作品を取得する（論理削除済みの作品のみ）
   * @param userId 作品を収録した書籍を所有するユーザーID
   * @param workId 物理削除の対象の作品ID
   * @returns 作品の更新日時（存在しない・他ユーザーの書籍の作品・削除されていない作品の場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ updatedAt: Timestamp } | null>;

  /**
   * 作品の物理削除
   * 作品と、作品の配下（登場人物・人物関係・気になるワード・出来事）を、削除フラグに関係なくすべて物理削除する。
   * すべて削除するか、何も削除しないかのどちらかにする（親のない子を残さないため）。
   * 保存時点の作品が削除済みでない、または作品の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で復元・更新された場合）は、何も削除しない。
   * @param workId 物理削除の対象の作品ID
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 削除した場合は true、他の操作で更新されていたため削除しなかった場合は false
   */
  deleteWork(workId: WorkId, expectedUpdatedAt: Timestamp): Promise<boolean>;
}
