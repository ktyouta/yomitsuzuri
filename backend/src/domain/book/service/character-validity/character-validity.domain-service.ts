import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { ICharacterValidityRepository } from "../../repository";

/**
 * 登場人物関係の項目のうち、登場人物を指すもの
 */
export type CharacterField = "characterId" | "targetCharacterId";

/**
 * 登場人物有効性判定ドメインサービス
 */
export class CharacterValidityDomainService {

    constructor(private readonly characterValidityRepository: ICharacterValidityRepository) { }

    /**
     * 登場人物関係の人物・相手のうち、関係と同じ作品の有効な登場人物ではないものを判定する
     * @param userId 書籍を所有するユーザーID
     * @param characterRelation 判定対象の登場人物関係
     * @returns 有効ではない項目の一覧（人物・相手のどちらも有効な場合は空配列）
     */
    async findInvalidFields(userId: UserId, characterRelation: CharacterRelationEntity): Promise<CharacterField[]> {
        const characters = await this.characterValidityRepository.findCharacters(userId, characterRelation);
        const validIds = new Set(characters.map((character) => character.id));
        const invalidFields: CharacterField[] = [];

        if (!validIds.has(characterRelation.characterId.value)) {
            invalidFields.push("characterId");
        }

        if (!validIds.has(characterRelation.targetCharacterId.value)) {
            invalidFields.push("targetCharacterId");
        }

        return invalidFields;
    }
}
