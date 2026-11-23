import { and, eq, exists, inArray } from "drizzle-orm";
import { BookId, Timestamp, UserId, type IHardDeleteBookRepository } from "../../../../domain";
import { authorTransaction, bookTransaction, characterRelationTransaction, characterTransaction, eventTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 書籍の物理削除リポジトリ実装
 */
export class HardDeleteBookRepository implements IHardDeleteBookRepository {
  constructor(private readonly db: Database) { }

  /**
   * 物理削除の対象の書籍を取得する（論理削除済みの書籍のみ）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 物理削除の対象の書籍ID
   * @returns 書籍の更新日時（存在しない・他ユーザーの書籍・削除されていない書籍の場合は null）
   */
  async findBook(userId: UserId, bookId: BookId): Promise<{ updatedAt: Timestamp } | null> {
    const bookResult = await this.db
      .select({
        updatedAt: bookTransaction.updatedAt,
      })
      .from(bookTransaction)
      .where(and(
        eq(bookTransaction.id, bookId.value),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, true),
      ));

    const book = bookResult[0];
    if (!book) {
      return null;
    }

    return { updatedAt: Timestamp.of(book.updatedAt) };
  }

  /**
   * 書籍の物理削除
   * 書籍と、書籍の著者・作品・作品の配下（登場人物・人物関係・気になるワード・出来事）を、削除フラグに関係なくすべて物理削除する。
   * 保存時点の書籍が削除済みでない、または書籍の更新日時が expectedUpdatedAt と一致しない場合は、何も削除しない。
   * @param bookId 物理削除の対象の書籍ID
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 削除した場合は true、他の操作で更新されていたため削除しなかった場合は false
   */
  async hardDeleteBook(bookId: BookId, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const id = bookId.value;

    // 書籍が取得時点の状態のまま（削除済み・更新日時が一致）であることの条件。確認と各削除で共有する
    const bookCondition = and(
      eq(bookTransaction.id, id),
      eq(bookTransaction.deleteFlg, true),
      eq(bookTransaction.updatedAt, expectedUpdatedAt.value),
    );

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、各削除を書籍が取得時点の状態のままであることを条件にする
    // 書籍は FK（no action）のため最後に削除するので、論理削除のように「書籍を更新できたこと」を後続の条件にはできない
    const bookUnchanged = exists(
      this.db
        .select({ id: bookTransaction.id })
        .from(bookTransaction)
        .where(bookCondition)
    );

    // 書籍に収録された作品のID（削除済みを含む全作品）
    const workIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .where(eq(workTransaction.bookId, id));

    // 一部だけが削除された状態を残さないため、batch で1トランザクションにする
    // batch は1トランザクションで順に実行されるため、最初の確認で書籍が条件を満たせば、後続の削除もすべて行われる
    // FK（no action）のため子から順に削除する（人物関係は登場人物を参照するため、登場人物より先に削除する）
    const [target] = await this.db.batch([
      this.db
        .select({ id: bookTransaction.id })
        .from(bookTransaction)
        .where(bookCondition),
      this.db
        .delete(characterRelationTransaction)
        .where(and(inArray(characterRelationTransaction.workId, workIds), bookUnchanged)),
      this.db
        .delete(wordTransaction)
        .where(and(inArray(wordTransaction.workId, workIds), bookUnchanged)),
      this.db
        .delete(eventTransaction)
        .where(and(inArray(eventTransaction.workId, workIds), bookUnchanged)),
      this.db
        .delete(characterTransaction)
        .where(and(inArray(characterTransaction.workId, workIds), bookUnchanged)),
      this.db
        .delete(workTransaction)
        .where(and(eq(workTransaction.bookId, id), bookUnchanged)),
      this.db
        .delete(authorTransaction)
        .where(and(eq(authorTransaction.bookId, id), bookUnchanged)),
      this.db
        .delete(bookTransaction)
        .where(bookCondition),
    ]);

    return target.length > 0;
  }
}
