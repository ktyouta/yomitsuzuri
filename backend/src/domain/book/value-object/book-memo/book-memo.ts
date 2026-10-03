/**
 * 書籍メモ
 * 未入力（null / undefined / 空白のみ）の場合は null として保持する
 */
export class BookMemo {

    static readonly MEMO_MAX_LENGTH = 2000;
    private readonly _value: string | null;

    /**
     * @param bookMemo 書籍メモ
     */
    constructor(bookMemo: string | null | undefined) {
        const trimmedMemo = bookMemo?.trim();

        if (!trimmedMemo) {
            this._value = null;
            return;
        }

        if (trimmedMemo.length > BookMemo.MEMO_MAX_LENGTH) {
            throw new Error(`書籍メモは${BookMemo.MEMO_MAX_LENGTH}文字以内で入力してください。`);
        }

        this._value = trimmedMemo;
    }

    get value() {
        return this._value;
    }
}