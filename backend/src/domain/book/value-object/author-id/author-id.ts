import { err, ok, Result } from "neverthrow";
import { ulid } from "ulid";

export type AuthorIdError = { type: "AUTHOR_ID_EMPTY" }

/**
 * 著者ID（ULID）
 */
export class AuthorId {

    private readonly _value: string;

    /**
     * @param authorId 著者ID
     */
    private constructor(authorId: string) {
        if (!authorId) {
            throw new Error(`著者IDが設定されていません。`);
        }

        this._value = authorId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで著者IDを生成
     * @returns 新規の著者ID
     */
    static create(): AuthorId {
        return new AuthorId(ulid());
    }

    /**
     * 既存の著者IDからインスタンスを生成
     * @param authorId 著者ID
     * @returns 著者ID
     */
    static of(authorId: string): AuthorId {
        return new AuthorId(authorId);
    }

    /**
     * 外部からの入力値から生成する（形式は判定しない。存在しない ID は著者の照合で検出する）
     * @param authorId 著者ID
     * @returns 成功時は著者ID、空の場合はその内容を持つ Result
     */
    static fromInput(authorId: string): Result<AuthorId, AuthorIdError> {
        if (!authorId) {
            return err({ type: "AUTHOR_ID_EMPTY" });
        }

        return ok(new AuthorId(authorId));
    }
}
