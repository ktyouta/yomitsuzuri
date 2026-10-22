import type { IGenderValidityRepository } from "../../repository";
import type { GenderId } from "../../value-object";

/**
 * 性別有効性判定ドメインサービス
 */
export class GenderValidityDomainService {

    constructor(private readonly genderValidityRepository: IGenderValidityRepository) { }

    /**
     * 性別が未入力、または gender_master に存在し有効（未削除）かを判定する
     * @param genderId 性別ID
     * @returns 未入力（null）の場合は問い合わせずに true、それ以外は存在し未削除の場合 true
     */
    async isValid(genderId: GenderId): Promise<boolean> {
        if (genderId.value === null) {
            return true;
        }
        return this.genderValidityRepository.exists(genderId);
    }
}
