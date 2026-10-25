import { and, asc, eq, sql } from "drizzle-orm";
import type { IGetListWordRepository, WordListItem, WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード一覧取得リポジトリ実装
 */
export class GetListWordRepository implements IGetListWordRepository {
  constructor(private readonly db: Database) { }

  async findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null> {
    const [work] = await this.db
      .select({
        id: workTransaction.id,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(this.buildWorkCondition(userId, workId));

    return work ?? null;
  }

  async findWordList(userId: UserId, workId: WorkId): Promise<WordListItem[]> {
    return this.db
      .select({
        id: wordTransaction.id,
        text: wordTransaction.text,
        page: wordTransaction.page,
        updatedAt: wordTransaction.updatedAt,
      })
      .from(wordTransaction)
      // 他ユーザー・論理削除済みの作品・書籍の気になるワードを返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(wordTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        this.buildWorkCondition(userId, workId),
        eq(wordTransaction.deleteFlg, false)
      ))
      // SQLite の昇順では null が先頭になるため、ページ未入力を末尾にするよう nulls last を指定する。同じページ内の順序を固定するため id を第2キーにする
      .orderBy(sql`${wordTransaction.page} asc nulls last`, asc(wordTransaction.id));
  }

  /**
   * 作品と気になるワードで共通の作品の抽出条件（気になるワード側への所有者条件の適用漏れを防ぐため共通化する）
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 指定ユーザーの論理削除されていない書籍に属する、論理削除されていない指定作品を抽出する条件
   */
  private buildWorkCondition(userId: UserId, workId: WorkId) {
    return and(
      eq(workTransaction.id, workId.value),
      eq(workTransaction.deleteFlg, false),
      eq(bookTransaction.userId, userId.value),
      eq(bookTransaction.deleteFlg, false)
    );
  }
}
