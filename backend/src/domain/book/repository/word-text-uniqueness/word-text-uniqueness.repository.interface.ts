import type { UserId } from "../../../shared";
import type { WordId, WordText, WorkId } from "../../value-object";

/**
 * 気になるワード一意性判定リポジトリインターフェース
 */
export interface IWordTextUniquenessRepository {
    /**
     * 同じワードの取得（同一ユーザーの同一作品内・未削除のもの）
     * wordId 自身は判定対象から除外する（更新時の自己重複を防ぐ）。
     * @param userId 書籍を所有するユーザーID
     * @param workId 気になるワードが属する作品ID
     * @param wordId 判定対象から除外する気になるワードID
     * @param wordText 気になるワード
     * @returns 同じワードの ID 一覧
     */
    findWord(userId: UserId, workId: WorkId, wordId: WordId, wordText: WordText): Promise<{ id: string }[]>;
}
