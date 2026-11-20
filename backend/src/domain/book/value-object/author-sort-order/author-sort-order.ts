import { err, ok, type Result } from "neverthrow";

/**
 * 著者の表示順の生成失敗
 */
export type AuthorSortOrderError = { type: "AUTHOR_SORT_ORDER_INVALID"; min: number };

/**
 * 書籍内での著者の表示順（1始まり）
 */
export class AuthorSortOrder {

    static readonly FIRST = 1;
    private readonly _value: number;

    /**
     * @param sortOrder 表示順（FIRST 以上の整数）
     */
    private constructor(sortOrder: number) {
        this._value = sortOrder;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する
     * @param sortOrder 表示順
     * @returns 成功時は表示順、FIRST 以上の整数でない場合はその内容を持つ Result
     */
    static create(sortOrder: number): Result<AuthorSortOrder, AuthorSortOrderError> {
        if (!Number.isInteger(sortOrder) || sortOrder < AuthorSortOrder.FIRST) {
            return err({ type: "AUTHOR_SORT_ORDER_INVALID", min: AuthorSortOrder.FIRST });
        }

        return ok(new AuthorSortOrder(sortOrder));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param sortOrder 表示順
     * @returns 表示順
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(sortOrder: number): AuthorSortOrder {
        if (!Number.isInteger(sortOrder) || sortOrder < AuthorSortOrder.FIRST) {
            throw new Error(`著者の表示順が不正です。sortOrder:${sortOrder}`);
        }

        return new AuthorSortOrder(sortOrder);
    }
}
