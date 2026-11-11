import type { Timestamp, UserId } from "../../../shared";
import type { BookAggregate } from "../../aggregate";
import type { WorkEntity } from "../../entity";
import type { WorkId } from "../../value-object";

/**
 * 作品削除リポジトリインターフェース
 */
export interface IDeleteWorkRepository {
  /**
   * 削除対象の作品を収録した書籍集約を取得する（論理削除されていない書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param workId 削除対象の作品ID
   * @returns 削除前の書籍集約（作品が存在しない・他ユーザーの書籍の作品・書籍が論理削除済みの場合は null）
   */
  findBook(userId: UserId, workId: WorkId): Promise<BookAggregate | null>;

  /**
   * 作品削除
   * 対象の作品の削除フラグ・表示順・更新日時を保存し、作品の配下（登場人物・人物関係・気になるワード・出来事）のうち削除されていないものを、
   * 作品と同じ更新日時で論理削除する（配下の表示順は変更しない。docs/delete-restore/plan.md の U10・U13）。書籍と他の作品は保存しない。
   * 作品と配下は、すべて保存するか、何も保存しないかのどちらかにする（親が削除済みで子が有効な状態を作らないため。U14）。
   * 保存時点の作品が削除済み、または作品の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param work 削除後の作品
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  deleteWork(work: WorkEntity, expectedUpdatedAt: Timestamp): Promise<boolean>;
}
