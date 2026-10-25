import { err, ok, type Result } from "neverthrow";

/**
 * 気になるワードのメモの生成失敗
 */
export type WordMemoError = { type: "WORD_MEMO_TOO_LONG"; max: number };

/**
 * 気になるワードのメモ
 */
export class WordMemo {

    static readonly MEMO_MAX_LENGTH = 2000;
    private readonly _value: string | null;

    /**
     * @param wordMemo 前後の空白を除去済みの気になるワードのメモ（未入力は null）
     */
    private constructor(wordMemo: string | null) {
        this._value = wordMemo;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param wordMemo 気になるワードのメモ
     * @returns 成功時は気になるワードのメモ、上限文字数超過の場合はその内容を持つ Result
     */
    static create(wordMemo: string | null | undefined): Result<WordMemo, WordMemoError> {
        const trimmed = wordMemo?.trim();

        if (!trimmed) {
            return ok(new WordMemo(null));
        }

        if (trimmed.length > WordMemo.MEMO_MAX_LENGTH) {
            return err({ type: "WORD_MEMO_TOO_LONG", max: WordMemo.MEMO_MAX_LENGTH });
        }

        return ok(new WordMemo(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param wordMemo 気になるワードのメモ
     * @returns 気になるワードのメモ
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(wordMemo: string | null | undefined): WordMemo {
        return WordMemo.create(wordMemo).match(
            (value) => value,
            (error) => { throw new Error(`気になるワードのメモが不正です。type:${error.type}`); },
        );
    }
}
