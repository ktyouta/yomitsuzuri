import { err, ok, Result } from "neverthrow";
import type { UserId } from "../../../shared";
import type { ICharacterNameUniquenessRepository } from "../../repository";
import type { CharacterId, CharacterName, WorkId } from "../../value-object";

/**
 * 登場人物名の一意性の違反
 * - DUPLICATE_NAME: 削除されていない同名の登場人物がある
 * - DUPLICATE_DELETED_NAME: 削除済みの同名の登場人物だけがある（復元するか、別の名前にする必要がある）
 */
export type CharacterNameUniquenessError =
    | { type: "DUPLICATE_NAME" }
    | { type: "DUPLICATE_DELETED_NAME" };

/**
 * 登場人物名一意性判定ドメインサービス
 */
export class CharacterNameUniquenessDomainService {

    constructor(private readonly characterNameUniquenessRepository: ICharacterNameUniquenessRepository) { }

    /**
     * 登場人物名の一意性を検証する。
     * 削除済みの登場人物も重複の対象にする（復元したときに重複させないため）。
     * characterId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     *
     * err の条件:
     * - DUPLICATE_NAME: 同一ユーザーの同一作品内に、characterId 以外で削除されていない同名の登場人物がある（削除済みの同名もある場合を含む）
     * - DUPLICATE_DELETED_NAME: 同一ユーザーの同一作品内に、characterId 以外で削除済みの同名の登場人物だけがある
     * @param userId 書籍を所有するユーザーID
     * @param workId 登場人物が属する作品ID
     * @param characterId 判定対象から除外する登場人物ID
     * @param characterName 登場人物名
     * @returns 同名の登場人物がなければ ok、あればその違反を持つ Result
     */
    async validate(userId: UserId, workId: WorkId, characterId: CharacterId, characterName: CharacterName): Promise<Result<undefined, CharacterNameUniquenessError>> {
        const result = await this.characterNameUniquenessRepository.findCharacter(userId, workId, characterId, characterName);

        if (result.some((e) => !e.deleteFlg)) {
            return err({ type: "DUPLICATE_NAME" });
        }
        if (result.length > 0) {
            return err({ type: "DUPLICATE_DELETED_NAME" });
        }

        return ok(undefined);
    }
}
