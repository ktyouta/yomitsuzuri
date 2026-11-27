import { err, ok, type Result } from "neverthrow";

/**
 * タグの並び順の生成失敗
 */
export type TagSortOrderError = { type: "TAG_SORT_ORDER_INVALID"; min: number };

/**
 * 書籍内でのタグの並び順（1始まり）
 */
export class TagSortOrder {

    static readonly FIRST = 1;
    private readonly _value: number;

    /**
     * @param sortOrder 並び順（FIRST 以上の整数）
     */
    private constructor(sortOrder: number) {
        this._value = sortOrder;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する
     * @param sortOrder 並び順
     * @returns 成功時は並び順、FIRST 以上の整数でない場合はその内容を持つ Result
     */
    static create(sortOrder: number): Result<TagSortOrder, TagSortOrderError> {
        if (!Number.isInteger(sortOrder) || sortOrder < TagSortOrder.FIRST) {
            return err({ type: "TAG_SORT_ORDER_INVALID", min: TagSortOrder.FIRST });
        }

        return ok(new TagSortOrder(sortOrder));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param sortOrder 並び順
     * @returns 並び順
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(sortOrder: number): TagSortOrder {
        return TagSortOrder.create(sortOrder).match(
            (tagSortOrder) => tagSortOrder,
            (error) => { throw new Error(`タグの並び順が不正です。type:${error.type} sortOrder:${sortOrder}`); },
        );
    }
}
