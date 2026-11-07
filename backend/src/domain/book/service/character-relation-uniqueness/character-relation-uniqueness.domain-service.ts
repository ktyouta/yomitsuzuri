import { err, ok, Result } from "neverthrow";
import type { UserId } from "../../../shared";
import type { CharacterRelationEntity } from "../../entity";
import type { ICharacterRelationUniquenessRepository } from "../../repository";

/**
 * 登場人物関係の一意性の違反
 * - DUPLICATE_RELATION: 削除されていない同じ関係がある
 * - DUPLICATE_DELETED_RELATION: 削除済みの同じ関係だけがある（復元するか、別の関係にする必要がある）
 */
export type CharacterRelationUniquenessError =
    | { type: "DUPLICATE_RELATION" }
    | { type: "DUPLICATE_DELETED_RELATION" };

/**
 * 登場人物関係一意性判定ドメインサービス
 */
export class CharacterRelationUniquenessDomainService {

    constructor(private readonly characterRelationUniquenessRepository: ICharacterRelationUniquenessRepository) { }

    /**
     * 登場人物関係の一意性を検証する。
     * 同じ2人の間（向きを問わない）に同じ関係名の関係があるかを判定する。
     * 削除済みの関係も重複の対象にする（復元したときに重複させないため）。
     * 判定対象の関係自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる
     * （更新では update で変更後の値にしてから呼び出す）。
     *
     * err の条件:
     * - DUPLICATE_RELATION: 同一ユーザーの同一作品内に、自身以外で削除されていない同じ関係がある（削除済みの同じ関係もある場合を含む）
     * - DUPLICATE_DELETED_RELATION: 同一ユーザーの同一作品内に、自身以外で削除済みの同じ関係だけがある
     * @param userId 書籍を所有するユーザーID
     * @param characterRelation 判定対象の登場人物関係（作品・人物・相手・関係名で判定し、自身の ID は除外する）
     * @returns 同じ関係がなければ ok、あればその違反を持つ Result
     */
    async validate(userId: UserId, characterRelation: CharacterRelationEntity): Promise<Result<undefined, CharacterRelationUniquenessError>> {
        const result = await this.characterRelationUniquenessRepository.findCharacterRelation(userId, characterRelation);

        if (result.some((e) => !e.deleteFlg)) {
            return err({ type: "DUPLICATE_RELATION" });
        }
        if (result.length > 0) {
            return err({ type: "DUPLICATE_DELETED_RELATION" });
        }

        return ok(undefined);
    }
}
