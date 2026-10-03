/**
 * 書籍タイトル
 */
export class BookTitle {

    static readonly TITLE_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param bookTitle 書籍タイトル
     */
    constructor(bookTitle: string) {
        const trimmedTitle = bookTitle.trim();

        if (!trimmedTitle) {
            throw new Error(`書籍タイトルが設定されていません。`);
        }

        if (trimmedTitle.length > BookTitle.TITLE_MAX_LENGTH) {
            throw new Error(`書籍タイトルは${BookTitle.TITLE_MAX_LENGTH}文字以内で入力してください。`);
        }

        this._value = trimmedTitle;
    }

    get value() {
        return this._value;
    }
}