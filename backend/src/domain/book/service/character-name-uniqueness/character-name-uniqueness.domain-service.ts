import type { UserId } from "../../../shared";
import type { ICharacterNameUniquenessRepository } from "../../repository";
import type { CharacterId, CharacterName, WorkId } from "../../value-object";

/**
 * 登場人物名一意性判定ドメインサービス
 */
export class CharacterNameUniquenessDomainService {

    constructor(private readonly characterNameUniquenessRepository: ICharacterNameUniquenessRepository) { }

    /**
     * 同名登場人物の重複判定。
     * characterId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     * @param userId 書籍を所有するユーザーID
     * @param workId 登場人物が属する作品ID
     * @param characterId 判定対象から除外する登場人物ID
     * @param characterName 登場人物名
     * @returns 同一ユーザーの同一作品内に同名の登場人物（未削除・characterId 以外）が存在する場合 true
     */
    async isDuplicated(userId: UserId, workId: WorkId, characterId: CharacterId, characterName: CharacterName): Promise<boolean> {
        const result = await this.characterNameUniquenessRepository.findCharacter(userId, workId, characterId, characterName);
        return result.length > 0;
    }
}
