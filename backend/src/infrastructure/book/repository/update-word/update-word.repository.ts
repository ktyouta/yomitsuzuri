import { and, eq } from "drizzle-orm";
import { WordEntity, WordId, WordMemo, WordPage, WordText, WorkId, type IUpdateWordRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード更新リポジトリ実装
 */
export class UpdateWordRepository implements IUpdateWordRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの気になるワードを1件取得
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 気になるワード（気になるワードが存在しない・他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みの場合は null）
   */
  async findWord(userId: UserId, wordId: WordId): Promise<WordEntity | null> {
    const [word] = await this.db
      .select({
        id: wordTransaction.id,
        workId: wordTransaction.workId,
        text: wordTransaction.text,
        memo: wordTransaction.memo,
        page: wordTransaction.page,
        deleteFlg: wordTransaction.deleteFlg,
      })
      .from(wordTransaction)
      // 他ユーザー・論理削除済みの作品や書籍の気になるワードを返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(wordTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(wordTransaction.id, wordId.value),
        eq(wordTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    if (!word) {
      return null;
    }

    return WordEntity.reconstruct({
      id: WordId.of(word.id),
      workId: WorkId.of(word.workId),
      text: WordText.of(word.text),
      memo: WordMemo.of(word.memo),
      page: WordPage.of(word.page),
      deleteFlg: word.deleteFlg,
    });
  }

  /**
   * 気になるワード更新
   * @param word 更新後の気になるワード
   */
  async updateWord(word: WordEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = word.toSnapshot();

    await this.db.update(wordTransaction)
      .set({
        text: snapshot.text,
        memo: snapshot.memo,
        page: snapshot.page,
        updatedAt: now,
      })
      .where(and(
        eq(wordTransaction.id, snapshot.id),
        eq(wordTransaction.deleteFlg, false),
      ));
  }
}
