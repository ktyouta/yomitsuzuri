import type { UserId } from "../../../shared";
import type { CharacterId, CharacterName, WorkId } from "../../value-object";

/**
 * 登場人物名一意性判定リポジトリインターフェース
 */
export interface ICharacterNameUniquenessRepository {
    /**
     * 同名登場人物の取得（同一ユーザーの同一作品内・未削除のもの）
     * characterId 自身は判定対象から除外する（更新時の自己重複を防ぐ）。
     * @param userId 書籍を所有するユーザーID
     * @param workId 登場人物が属する作品ID
     * @param characterId 判定対象から除外する登場人物ID
     * @param characterName 登場人物名
     * @returns 同名登場人物の ID 一覧
     */
    findCharacter(userId: UserId, workId: WorkId, characterId: CharacterId, characterName: CharacterName): Promise<{ id: string }[]>;
}
