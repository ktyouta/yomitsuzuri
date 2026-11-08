import { and, eq, ne } from "drizzle-orm";
import type { IWordTextUniquenessRepository, UserId, WordId, WordText, WorkId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード一意性判定リポジトリ実装
 */
export class WordTextUniquenessRepository implements IWordTextUniquenessRepository {
  constructor(private readonly db: Database) { }

  /**
   * 同じワードの取得（同一ユーザーの同一作品内・削除済みを含む）
   * wordId 自身は除外する（更新時の自己重複を防ぐ）。
   * @param userId 書籍を所有するユーザーID
   * @param workId 気になるワードが属する作品ID
   * @param wordId 判定対象から除外する気になるワードID
   * @param wordText 気になるワード
   * @returns 同じワードの ID と削除フラグの一覧
   */
  async findWord(userId: UserId, workId: WorkId, wordId: WordId, wordText: WordText): Promise<{ id: string, deleteFlg: boolean }[]> {
    const result = await this.db
      .select({
        id: wordTransaction.id,
        deleteFlg: wordTransaction.deleteFlg,
      })
      .from(wordTransaction)
      // 他ユーザーの作品の気になるワードを返さないため、書籍側の所有者で絞り込む
      .innerJoin(workTransaction, eq(wordTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(wordTransaction.workId, workId.value),
        eq(wordTransaction.text, wordText.value),
        ne(wordTransaction.id, wordId.value),
        eq(bookTransaction.userId, userId.value),
      ));

    return result;
  }
}
