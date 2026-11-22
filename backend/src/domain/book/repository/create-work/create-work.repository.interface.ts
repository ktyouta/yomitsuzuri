import type { UserId } from "../../../shared";
import type { BookAggregate } from "../../aggregate";
import type { WorkEntity } from "../../entity";
import type { BookId } from "../../value-object";

/**
 * 作品追加リポジトリインターフェース
 */
export interface ICreateWorkRepository {
  /**
   * 作品を追加する書籍集約を取得する（論理削除されていない書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 作品を追加する書籍ID
   * @returns 追加前の書籍集約（存在しない・他ユーザーの書籍・論理削除済みの書籍の場合は null）
   */
  findBook(userId: UserId, bookId: BookId): Promise<BookAggregate | null>;

  /**
   * 作品追加
   * 作品を書籍に追加して保存する（書籍と他の作品は保存しない）。
   * @param bookId 作品を追加する書籍ID
   * @param work 追加する作品
   */
  createWork(bookId: BookId, work: WorkEntity): Promise<void>;
}
