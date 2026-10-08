import type { IIconValidityRepository } from "../../repository";
import type { IconId } from "../../value-object";

/**
 * アイコン有効性判定ドメインサービス
 */
export class IconValidityDomainService {

    constructor(private readonly iconValidityRepository: IIconValidityRepository) { }

    /**
     * アイコンが icon_master に存在し、有効（未削除）かを判定する
     * @param iconId アイコンID
     * @returns 存在し未削除の場合 true
     */
    async isValid(iconId: IconId): Promise<boolean> {
        return this.iconValidityRepository.exists(iconId);
    }
}
