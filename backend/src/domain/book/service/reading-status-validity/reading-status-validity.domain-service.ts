import type { IReadingStatusValidityRepository } from "../../repository";
import type { ReadingStatusId } from "../../value-object";

/**
 * 読書状況有効性判定ドメインサービス
 */
export class ReadingStatusValidityDomainService {

    constructor(private readonly readingStatusValidityRepository: IReadingStatusValidityRepository) { }

    /**
     * 読書状況が reading_status_master に存在し、有効（未削除）かを判定する
     * @param readingStatusId 読書状況ID
     * @returns 存在し未削除の場合 true
     */
    async isValid(readingStatusId: ReadingStatusId): Promise<boolean> {
        return this.readingStatusValidityRepository.exists(readingStatusId);
    }
}
