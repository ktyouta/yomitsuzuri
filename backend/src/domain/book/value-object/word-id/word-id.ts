import { ulid } from "ulid";

/**
 * 気になるワードID（ULID）
 */
export class WordId {

    private readonly _value: string;

    /**
     * @param wordId 気になるワードID
     * @throws 気になるワードIDが空の場合
     */
    private constructor(wordId: string) {
        if (!wordId) {
            throw new Error(`気になるワードIDが設定されていません。`);
        }

        this._value = wordId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで気になるワードIDを生成
     * @returns 新規の気になるワードID
     */
    static create(): WordId {
        return new WordId(ulid());
    }

    /**
     * 既存の気になるワードIDからインスタンスを生成
     * @param wordId 気になるワードID
     * @returns 気になるワードID
     */
    static of(wordId: string): WordId {
        return new WordId(wordId);
    }
}
