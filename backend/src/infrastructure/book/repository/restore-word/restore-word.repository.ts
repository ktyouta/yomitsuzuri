import { and, eq } from "drizzle-orm";
import { WordEntity, WordId, WordMemo, WordPage, WordText, WorkId, type IRestoreWordRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, wordTransaction, workTransaction } from "../../../db";

/**
 * 気になるワード復元リポジトリ実装
 */
export class RestoreWordRepository implements IRestoreWordRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの削除済みの気になるワードを1件取得
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 削除済みの気になるワード（気になるワードが存在しない・削除されていない・他ユーザーの書籍の気になるワード・作品または書籍が論理削除済みの場合は null）
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
        eq(wordTransaction.deleteFlg, true),
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
   * 気になるワードの削除状態を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は更新しない。
   * @param word 削除済みを解除した気になるワード
   */
  async restoreWord(word: WordEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = word.toSnapshot();

    await this.db.update(wordTransaction)
      .set({
        deleteFlg: snapshot.deleteFlg,
        updatedAt: now,
      })
      .where(and(
        eq(wordTransaction.id, snapshot.id),
        eq(wordTransaction.deleteFlg, true),
      ));
  }
}
