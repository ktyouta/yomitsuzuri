import { and, eq, ne } from "drizzle-orm";
import type { IWordTextUniquenessRepository, WordId, WordText, WorkId } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード一意性判定リポジトリ実装
 */
export class WordTextUniquenessRepository implements IWordTextUniquenessRepository {
  constructor(private readonly db: Database) { }

  /**
   * 同じワードの取得（同一ユーザーの同一作品内・未削除のもの）
   * wordId 自身は除外する（更新時の自己重複を防ぐ）。
   * @param userId 書籍を所有するユーザーID
   * @param workId 気になるワードが属する作品ID
   * @param wordId 判定対象から除外する気になるワードID
   * @param wordText 気になるワード
   * @returns 同じワードの ID 一覧
   */
  async findWord(userId: UserId, workId: WorkId, wordId: WordId, wordText: WordText): Promise<{ id: string }[]> {
    const result = await this.db
      .select({
        id: wordTransaction.id,
      })
      .from(wordTransaction)
      // 他ユーザーの作品の気になるワードを返さないため、書籍側の所有者で絞り込む
      .innerJoin(workTransaction, eq(wordTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(wordTransaction.deleteFlg, false),
        eq(wordTransaction.workId, workId.value),
        eq(wordTransaction.text, wordText.value),
        ne(wordTransaction.id, wordId.value),
        eq(bookTransaction.userId, userId.value),
      ));

    return result;
  }
}
