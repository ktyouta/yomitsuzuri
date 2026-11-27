import { ulid } from "ulid";

/**
 * 書籍タグID（ULID）
 */
export class BookTagId {

    private readonly _value: string;

    /**
     * @param bookTagId 書籍タグID
     */
    private constructor(bookTagId: string) {
        if (!bookTagId) {
            throw new Error(`書籍タグIDが設定されていません。`);
        }

        this._value = bookTagId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで書籍タグIDを生成
     * @returns 新規の書籍タグID
     */
    static create(): BookTagId {
        return new BookTagId(ulid());
    }

    /**
     * 既存の書籍タグIDからインスタンスを生成
     * @param bookTagId 書籍タグID
     * @returns 書籍タグID
     */
    static of(bookTagId: string): BookTagId {
        return new BookTagId(bookTagId);
    }
}