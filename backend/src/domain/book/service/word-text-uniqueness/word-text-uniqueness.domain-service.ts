import { err, ok, Result } from "neverthrow";
import type { UserId } from "../../../shared";
import type { IWordTextUniquenessRepository } from "../../repository";
import type { WordId, WordText, WorkId } from "../../value-object";

/**
 * 気になるワードの一意性の違反
 * - DUPLICATE_TEXT: 削除されていない同じワードがある
 * - DUPLICATE_DELETED_TEXT: 削除済みの同じワードだけがある（復元するか、別のワードにする必要がある）
 */
export type WordTextUniquenessError =
    | { type: "DUPLICATE_TEXT" }
    | { type: "DUPLICATE_DELETED_TEXT" };

/**
 * 気になるワード一意性判定ドメインサービス
 */
export class WordTextUniquenessDomainService {

    constructor(private readonly wordTextUniquenessRepository: IWordTextUniquenessRepository) { }

    /**
     * 気になるワードの一意性を検証する。
     * 削除済みのワードも重複の対象にする（復元したときに重複させないため）。
     * wordId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     *
     * err の条件:
     * - DUPLICATE_TEXT: 同一ユーザーの同一作品内に、wordId 以外で削除されていない同じワードがある（削除済みの同じワードもある場合を含む）
     * - DUPLICATE_DELETED_TEXT: 同一ユーザーの同一作品内に、wordId 以外で削除済みの同じワードだけがある
     * @param userId 書籍を所有するユーザーID
     * @param workId 気になるワードが属する作品ID
     * @param wordId 判定対象から除外する気になるワードID
     * @param wordText 気になるワード
     * @returns 同じワードがなければ ok、あればその違反を持つ Result
     */
    async validate(userId: UserId, workId: WorkId, wordId: WordId, wordText: WordText): Promise<Result<undefined, WordTextUniquenessError>> {
        const result = await this.wordTextUniquenessRepository.findWord(userId, workId, wordId, wordText);

        if (result.some((e) => !e.deleteFlg)) {
            return err({ type: "DUPLICATE_TEXT" });
        }
        if (result.length > 0) {
            return err({ type: "DUPLICATE_DELETED_TEXT" });
        }

        return ok(undefined);
    }
}
