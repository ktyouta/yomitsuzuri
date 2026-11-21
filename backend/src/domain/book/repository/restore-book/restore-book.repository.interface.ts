import type { Timestamp, UserId } from "../../../shared";
import type { BookAggregate, EventTimelineAggregate } from "../../aggregate";
import type { BookId, WorkId } from "../../value-object";

/**
 * 書籍復元リポジトリインターフェース
 */
export interface IRestoreBookRepository {
  /**
   * 復元対象の書籍集約を取得する（論理削除済みの書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 復元対象の書籍ID
   * @returns 復元前の書籍集約（存在しない・他ユーザーの書籍・削除されていない書籍の場合は null）
   */
  findBook(userId: UserId, bookId: BookId): Promise<BookAggregate | null>;

  /**
   * 復元対象の書籍に収録された作品の、出来事の並びを取得する
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品に属する、論理削除済みの出来事の並び（出来事がない・他ユーザーの書籍の作品・書籍が削除されていない場合は空の並び）
   */
  findEventTimeline(userId: UserId, workId: WorkId): Promise<EventTimelineAggregate>;

  /**
   * 書籍復元
   * 書籍の削除フラグ・更新日時を保存し、書籍の著者・作品と、作品の配下（登場人物・人物関係・気になるワード・出来事）のうち削除済みのものを、
   * 書籍と同じ更新日時で復元する（docs/delete-restore/plan.md の U10）。
   * 作品は引数の書籍集約が持つ表示順で、出来事は引数の出来事の並びが持つ時系列順で保存する（U13）。
   * 書籍・著者・作品・配下は、すべて保存するか、何も保存しないかのどちらかにする（親が有効で子だけ削除済みの状態を作らないため。U14）。
   * 保存時点の書籍が削除されていない、または書籍の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param book 復元後の書籍
   * @param eventTimeline 削除済みを解除し、時系列順を付けた作品ごとの出来事の並び
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  restoreBook(book: BookAggregate, eventTimeline: EventTimelineAggregate[], expectedUpdatedAt: Timestamp): Promise<boolean>;
}
