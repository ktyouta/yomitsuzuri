import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";

/**
 * 登場人物関係一意性判定リポジトリインターフェース
 */
export interface ICharacterRelationUniquenessRepository {
    /**
     * 重複する登場人物関係の取得（同一ユーザーの同一作品内・削除済みを含む）
     * 同じ2人の間（人物と相手が逆向きのものを含む）で、関係名が同じものを返す。
     * 判定対象の関係自身は除外する（更新時の自己重複を防ぐ）。
     * @param userId 書籍を所有するユーザーID
     * @param characterRelation 判定対象の登場人物関係
     * @returns 重複する登場人物関係の ID と削除フラグの一覧
     */
    findCharacterRelation(userId: UserId, characterRelation: CharacterRelationEntity): Promise<{ id: string, deleteFlg: boolean }[]>;
}
