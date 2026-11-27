import { ulid } from "ulid";

/**
 * タグID（ULID）
 */
export class TagId {

    private readonly _value: string;

    /**
     * @param tagId タグID
     */
    private constructor(tagId: string) {
        if (!tagId) {
            throw new Error(`タグIDが設定されていません。`);
        }

        this._value = tagId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDでタグIDを生成
     * @returns 新規のタグID
     */
    static create(): TagId {
        return new TagId(ulid());
    }

    /**
     * 既存のタグIDからインスタンスを生成
     * @param tagId タグID
     * @returns タグID
     */
    static of(tagId: string): TagId {
        return new TagId(tagId);
    }
}