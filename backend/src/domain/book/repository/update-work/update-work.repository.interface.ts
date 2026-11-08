import type { UserId } from "../../../shared";
import type { BookAggregate } from "../../aggregate";
import type { WorkEntity } from "../../entity";
import type { WorkId } from "../../value-object";

/**
 * 作品更新リポジトリインターフェース
 */
export interface IUpdateWorkRepository {
  /**
   * 更新対象の作品を収録した書籍集約を取得する（論理削除されていない書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param workId 更新対象の作品ID
   * @returns 更新前の書籍集約（作品が存在しない・他ユーザーの書籍の作品・書籍が論理削除済みの場合は null）
   */
  findBook(userId: UserId, workId: WorkId): Promise<BookAggregate | null>;

  /**
   * 作品更新
   * 対象の作品の作品名・メモ・アイコン・更新日時を保存する（書籍と他の作品は保存しない）。
   * 保存時点の作品の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param work 更新後の作品
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  updateWork(work: WorkEntity, expectedUpdatedAt: string): Promise<boolean>;
}
