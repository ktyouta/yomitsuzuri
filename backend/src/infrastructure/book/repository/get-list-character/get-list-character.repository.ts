import { and, desc, eq } from "drizzle-orm";
import type { CharacterListItem, IGetListCharacterRepository, UserId, WorkId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, characterTransaction, workTransaction } from "../../../db";

/**
 * 登場人物一覧取得リポジトリ実装
 */
export class GetListCharacterRepository implements IGetListCharacterRepository {
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

  async findCharacterList(userId: UserId, workId: WorkId): Promise<CharacterListItem[]> {
    return this.db
      .select({
        id: characterTransaction.id,
        name: characterTransaction.name,
        age: characterTransaction.age,
        occupation: characterTransaction.occupation,
        updatedAt: characterTransaction.updatedAt,
        deleteFlg: characterTransaction.deleteFlg,
      })
      .from(characterTransaction)
      // 他ユーザー・論理削除済みの作品・書籍の登場人物を返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(characterTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      // 削除済みの登場人物も一覧に薄いカードで表示するため、登場人物の削除フラグでは絞り込まない
      .where(this.buildWorkCondition(userId, workId))
      // 更新日時が同じ登場人物の順序を固定するため id を第2キーにする
      .orderBy(desc(characterTransaction.updatedAt), desc(characterTransaction.id));
  }

  /**
   * 作品と登場人物で共通の作品の抽出条件（登場人物側への所有者条件の適用漏れを防ぐため共通化する）
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
