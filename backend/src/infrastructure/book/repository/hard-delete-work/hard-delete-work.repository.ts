import { and, eq, exists } from "drizzle-orm";
import { Timestamp, UserId, WorkId, type IHardDeleteWorkRepository } from "../../../../domain";
import { bookTransaction, characterRelationTransaction, characterTransaction, eventTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 作品の物理削除リポジトリ実装
 */
export class HardDeleteWorkRepository implements IHardDeleteWorkRepository {
  constructor(private readonly db: Database) { }

  /**
   * 物理削除の対象の作品を取得する（論理削除済みの作品のみ）
   * @param userId 作品を収録した書籍を所有するユーザーID
   * @param workId 物理削除の対象の作品ID
   * @returns 作品の更新日時（存在しない・他ユーザーの書籍の作品・削除されていない作品の場合は null）
   */
  async findWork(userId: UserId, workId: WorkId): Promise<{ updatedAt: Timestamp } | null> {
    const workResult = await this.db
      .select({
        updatedAt: workTransaction.updatedAt,
      })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.id, workId.value),
        eq(bookTransaction.userId, userId.value),
        eq(workTransaction.deleteFlg, true),
      ));

    const work = workResult[0];
    if (!work) {
      return null;
    }

    return { updatedAt: Timestamp.of(work.updatedAt) };
  }

  /**
   * 作品の物理削除
   * 作品と、作品の配下（登場人物・人物関係・気になるワード・出来事）を、削除フラグに関係なくすべて物理削除する。
   * 保存時点の作品が削除済みでない、または作品の更新日時が expectedUpdatedAt と一致しない場合は、何も削除しない。
   * @param workId 物理削除の対象の作品ID
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 削除した場合は true、他の操作で更新されていたため削除しなかった場合は false
   */
  async deleteWork(workId: WorkId, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const id = workId.value;

    // 作品が取得時点の状態のまま（削除済み・更新日時が一致）であることの条件。確認と各削除で共有する
    const workCondition = and(
      eq(workTransaction.id, id),
      eq(workTransaction.deleteFlg, true),
      eq(workTransaction.updatedAt, expectedUpdatedAt.value),
    );

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、各削除を作品が取得時点の状態のままであることを条件にする
    // 作品は FK（no action）のため最後に削除するので、論理削除のように「作品を更新できたこと」を後続の条件にはできない
    const workUnchanged = exists(
      this.db
        .select({ id: workTransaction.id })
        .from(workTransaction)
        .where(workCondition)
    );

    // 一部だけが削除された状態を残さないため、batch で1トランザクションにする
    // batch は1トランザクションで順に実行されるため、最初の確認で作品が条件を満たせば、後続の削除もすべて行われる
    // FK（no action）のため子から順に削除する（人物関係は登場人物を参照するため、登場人物より先に削除する）
    const [target] = await this.db.batch([
      this.db
        .select({ id: workTransaction.id })
        .from(workTransaction)
        .where(workCondition),
      this.db
        .delete(characterRelationTransaction)
        .where(and(eq(characterRelationTransaction.workId, id), workUnchanged)),
      this.db
        .delete(wordTransaction)
        .where(and(eq(wordTransaction.workId, id), workUnchanged)),
      this.db
        .delete(eventTransaction)
        .where(and(eq(eventTransaction.workId, id), workUnchanged)),
      this.db
        .delete(characterTransaction)
        .where(and(eq(characterTransaction.workId, id), workUnchanged)),
      this.db
        .delete(workTransaction)
        .where(workCondition),
    ]);

    return target.length > 0;
  }
}
