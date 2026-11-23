import { and, eq, exists, inArray, or } from "drizzle-orm";
import { CharacterId, UserId, type IHardDeleteCharacterRepository } from "../../../../domain";
import { bookTransaction, characterRelationTransaction, characterTransaction, workTransaction, type Database } from "../../../db";

/**
 * 登場人物の物理削除リポジトリ実装
 */
export class HardDeleteCharacterRepository implements IHardDeleteCharacterRepository {
  constructor(private readonly db: Database) { }

  /**
   * 登場人物の物理削除
   * 指定ユーザーの書籍の、論理削除済みの登場人物と、登場人物が人物または相手として関わる人物関係（削除フラグに関係なくすべて）を物理削除する。
   * 存在しない・他ユーザーの書籍の登場人物・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param characterId 物理削除の対象の登場人物ID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  async deleteCharacter(userId: UserId, characterId: CharacterId): Promise<boolean> {
    const id = characterId.value;

    // 指定ユーザーの書籍に収録された作品のID（所有者の確認に使う）
    const userWorkIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(eq(bookTransaction.userId, userId.value));

    // 登場人物が物理削除の対象である（指定ユーザーの書籍の、削除済みの登場人物である）ことの条件。確認と各削除で共有する
    const characterCondition = and(
      eq(characterTransaction.id, id),
      eq(characterTransaction.deleteFlg, true),
      inArray(characterTransaction.workId, userWorkIds),
    );

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、人物関係の削除を登場人物が対象であることを条件にする
    // 登場人物は FK（no action）のため最後に削除するので、「登場人物を削除できたこと」を人物関係の削除の条件にはできない
    const characterTarget = exists(
      this.db
        .select({ id: characterTransaction.id })
        .from(characterTransaction)
        .where(characterCondition)
    );

    // 参照先のない人物関係を残さないため、batch で1トランザクションにする
    // batch は1トランザクションで順に実行されるため、最初の確認で登場人物が条件を満たせば、後続の削除もすべて行われる
    // FK（no action）のため、登場人物を参照する人物関係から先に削除する
    const [target] = await this.db.batch([
      this.db
        .select({ id: characterTransaction.id })
        .from(characterTransaction)
        .where(characterCondition),
      this.db
        .delete(characterRelationTransaction)
        .where(and(
          or(
            eq(characterRelationTransaction.characterId, id),
            eq(characterRelationTransaction.targetCharacterId, id),
          ),
          characterTarget,
        )),
      this.db
        .delete(characterTransaction)
        .where(characterCondition),
    ]);

    return target.length > 0;
  }
}
