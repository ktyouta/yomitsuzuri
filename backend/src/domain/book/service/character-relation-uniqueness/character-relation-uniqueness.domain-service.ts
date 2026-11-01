import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { ICharacterRelationUniquenessRepository } from "../../repository";

/**
 * 登場人物関係一意性判定ドメインサービス
 */
export class CharacterRelationUniquenessDomainService {

    constructor(private readonly characterRelationUniquenessRepository: ICharacterRelationUniquenessRepository) { }

    /**
     * 登場人物関係の重複判定。
     * 同じ2人の間（向きを問わない）に同じ関係名の関係があるかを判定する。
     * 判定対象の関係自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる
     * （更新では update で変更後の値にしてから呼び出す）。
     * @param userId 書籍を所有するユーザーID
     * @param characterRelation 判定対象の登場人物関係（作品・人物・相手・関係名で判定し、自身の ID は除外する）
     * @returns 同一ユーザーの同一作品内に、同じ2人の間の同じ関係名の関係（未削除・自身以外）が存在する場合 true
     */
    async isDuplicated(userId: UserId, characterRelation: CharacterRelationEntity): Promise<boolean> {
        const result = await this.characterRelationUniquenessRepository.findCharacterRelation(userId, characterRelation);
        return result.length > 0;
    }
}
