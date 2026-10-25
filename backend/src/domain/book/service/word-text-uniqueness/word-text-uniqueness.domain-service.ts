import type { UserId } from "../../../shared";
import type { IWordTextUniquenessRepository } from "../../repository";
import type { WordId, WordText, WorkId } from "../../value-object";

/**
 * 気になるワード一意性判定ドメインサービス
 */
export class WordTextUniquenessDomainService {

    constructor(private readonly wordTextUniquenessRepository: IWordTextUniquenessRepository) { }

    /**
     * 同じワードの重複判定。
     * wordId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     * @param userId 書籍を所有するユーザーID
     * @param workId 気になるワードが属する作品ID
     * @param wordId 判定対象から除外する気になるワードID
     * @param wordText 気になるワード
     * @returns 同一ユーザーの同一作品内に同じワード（未削除・wordId 以外）が存在する場合 true
     */
    async isDuplicated(userId: UserId, workId: WorkId, wordId: WordId, wordText: WordText): Promise<boolean> {
        const result = await this.wordTextUniquenessRepository.findWord(userId, workId, wordId, wordText);
        return result.length > 0;
    }
}
