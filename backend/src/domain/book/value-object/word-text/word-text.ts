import { err, ok, type Result } from "neverthrow";

/**
 * 気になるワードの生成失敗
 */
export type WordTextError = { type: "WORD_EMPTY" }
    | { type: "WORD_TOO_LONG"; max: number };

/**
 * 気になるワード（ワード本体の文字列）
 */
export class WordText {

    static readonly WORD_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param word 前後の空白を除去済みの気になるワード
     */
    private constructor(word: string) {
        this._value = word;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param word 気になるワード
     * @returns 成功時は気になるワード、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(word: string): Result<WordText, WordTextError> {
        const trimmedWord = word.trim();

        if (!trimmedWord) {
            return err({ type: "WORD_EMPTY" });
        }

        if (trimmedWord.length > WordText.WORD_MAX_LENGTH) {
            return err({ type: "WORD_TOO_LONG", max: WordText.WORD_MAX_LENGTH });
        }

        return ok(new WordText(trimmedWord));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param word 気になるワード
     * @returns 気になるワード
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(word: string): WordText {
        return WordText.create(word).match(
            (value) => value,
            (error) => { throw new Error(`気になるワードが不正です。type:${error.type}`); },
        );
    }
}
