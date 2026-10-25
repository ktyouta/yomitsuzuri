import { err, ok, type Result } from "neverthrow";

/**
 * 気になるワードのページの生成失敗
 */
export type WordPageError = { type: "WORD_PAGE_INVALID"; min: number };

/**
 * 気になるワードが登場したページ
 */
export class WordPage {

    static readonly MIN_VALUE = 1;
    private readonly _value: number | null;

    /**
     * @param page 気になるワードが登場したページ（未入力は null）
     */
    private constructor(page: number | null) {
        this._value = page;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（未入力は null として保持する）
     * @param page 気になるワードが登場したページ
     * @returns 成功時は気になるワードのページ、MIN_VALUE 以上の整数でない場合はその内容を持つ Result
     */
    static create(page: number | null | undefined): Result<WordPage, WordPageError> {
        if (page === null || page === undefined) {
            return ok(new WordPage(null));
        }

        if (!Number.isInteger(page) || page < WordPage.MIN_VALUE) {
            return err({ type: "WORD_PAGE_INVALID", min: WordPage.MIN_VALUE });
        }

        return ok(new WordPage(page));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param page 気になるワードが登場したページ
     * @returns 気になるワードのページ
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(page: number | null | undefined): WordPage {
        return WordPage.create(page).match(
            (value) => value,
            (error) => { throw new Error(`気になるワードのページが不正です。type:${error.type}`); },
        );
    }
}
