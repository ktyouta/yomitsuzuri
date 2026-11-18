import { err, ok, type Result } from "neverthrow";

/**
 * 著者名の生成失敗
 */
export type AuthorNameError = { type: "AUTHOR_NAME_EMPTY" }
    | { type: "AUTHOR_NAME_TOO_LONG"; max: number };

/**
 * 著者名
 */
export class AuthorName {

    static readonly NAME_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param authorName 前後の空白を除去済みの著者名
     */
    private constructor(authorName: string) {
        this._value = authorName;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param authorName 著者名
     * @returns 成功時は著者名、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(authorName: string): Result<AuthorName, AuthorNameError> {
        const trimmedName = authorName.trim();

        if (!trimmedName) {
            return err({ type: "AUTHOR_NAME_EMPTY" });
        }

        if (trimmedName.length > AuthorName.NAME_MAX_LENGTH) {
            return err({ type: "AUTHOR_NAME_TOO_LONG", max: AuthorName.NAME_MAX_LENGTH });
        }

        return ok(new AuthorName(trimmedName));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param authorName 著者名
     * @returns 著者名
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(authorName: string): AuthorName {
        return AuthorName.create(authorName).match(
            (name) => name,
            (error) => { throw new Error(`著者名が不正です。type:${error.type}`); },
        );
    }
}
