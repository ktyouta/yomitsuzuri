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
        return (await this.findInvalid([iconId])).length === 0;
    }

    /**
     * 指定したアイコンのうち、icon_master に存在しない・削除済みのものを抽出する（問い合わせは1回）
     * @param iconIds アイコンID（重複を含んでもよい）
     * @returns 無効なアイコンID（同じ ID は1件にまとめる。すべて有効なら空配列）
     */
    async findInvalid(iconIds: IconId[]): Promise<IconId[]> {
        const uniqueIconIds = [...new Map(iconIds.map((e) => [e.value, e])).values()];
        const validIds = new Set(await this.iconValidityRepository.findValidIds(uniqueIconIds));

        return uniqueIconIds.filter((e) => !validIds.has(e.value));
    }
}
