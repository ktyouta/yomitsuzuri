import { and, eq } from "drizzle-orm";
import type { ICreateWordRepository, WordEntity, WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード作成リポジトリ実装
 */
export class CreateWordRepository implements ICreateWordRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  async findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null> {
    const [work] = await this.db
      .select({
        id: workTransaction.id,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.id, workId.value),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    return work ?? null;
  }

  /**
   * 気になるワード作成
   * @param word 作成する気になるワード
   */
  async createWord(word: WordEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = word.toSnapshot();

    await this.db.insert(wordTransaction).values({
      id: snapshot.id,
      workId: snapshot.workId,
      text: snapshot.text,
      memo: snapshot.memo,
      page: snapshot.page,
      deleteFlg: snapshot.deleteFlg,
      createdAt: now,
      updatedAt: now,
    });
  }
}
