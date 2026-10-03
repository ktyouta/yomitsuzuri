import { ulid } from "ulid";

/**
 * 書籍ID（ULID）
 */
export class BookId {

    private readonly _value: string;

    /**
     * @param bookId 書籍ID
     */
    private constructor(bookId: string) {
        if (!bookId) {
            throw new Error(`書籍IDが設定されていません。`);
        }

        this._value = bookId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで書籍IDを生成
     * @returns 新規の書籍ID
     */
    static generate(): BookId {
        return new BookId(ulid());
    }

    /**
     * 既存の書籍IDからインスタンスを生成
     * @param bookId 書籍ID
     * @returns 書籍ID
     */
    static of(bookId: string): BookId {
        return new BookId(bookId);
    }
}