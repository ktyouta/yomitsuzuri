import type { Timestamp, UserId } from "../../../shared";
import type { BookAggregate, EventTimelineAggregate } from "../../aggregate";
import type { WorkEntity } from "../../entity";
import type { WorkId } from "../../value-object";

/**
 * 作品復元リポジトリインターフェース
 */
export interface IRestoreWorkRepository {
  /**
   * 復元対象の作品を収録した書籍集約を取得する（論理削除されていない書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param workId 復元対象の作品ID
   * @returns 復元前の書籍集約（作品が存在しない・他ユーザーの書籍の作品・書籍が論理削除済みの場合は null）
   */
  findBook(userId: UserId, workId: WorkId): Promise<BookAggregate | null>;

  /**
   * 作品内の出来事の並びを取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品に属する、論理削除済みの出来事の並び（出来事がない・他ユーザーの書籍の作品・作品が削除されていない・書籍が論理削除済みの場合は空の並び）
   */
  findEventTimeline(userId: UserId, workId: WorkId): Promise<EventTimelineAggregate>;

  /**
   * 作品復元
   * 対象の作品の削除フラグ・表示順・更新日時を保存し、作品の配下（登場人物・人物関係・気になるワード・出来事）のうち削除済みのものを、
   * 作品と同じ更新日時で復元する（docs/delete-restore/plan.md の U10）。書籍と他の作品は保存しない。
   * 出来事は、引数の出来事の並びが持つ時系列順で保存する（U13）。
   * 作品と配下は、すべて保存するか、何も保存しないかのどちらかにする（親が有効で子だけ削除済みの状態を作らないため。U14）。
   * 保存時点の作品が削除されていない、または作品の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param work 復元後の作品
   * @param eventTimeline 削除済みを解除し、時系列順を付けた作品内の出来事の並び
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  restoreWork(work: WorkEntity, eventTimeline: EventTimelineAggregate, expectedUpdatedAt: Timestamp): Promise<boolean>;
}
