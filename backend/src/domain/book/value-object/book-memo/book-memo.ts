import { err, ok, type Result } from "neverthrow";

/**
 * 書籍メモの生成失敗
 */
export type BookMemoError = { type: "BOOK_MEMO_TOO_LONG"; max: number };

/**
 * 書籍メモ
 */
export class BookMemo {

    static readonly MEMO_MAX_LENGTH = 2000;
    private readonly _value: string | null;

    /**
     * @param bookMemo 前後の空白を除去済みの書籍メモ（未入力は null）
     */
    private constructor(bookMemo: string | null) {
        this._value = bookMemo;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param bookMemo 書籍メモ
     * @returns 成功時は書籍メモ、上限文字数超過の場合はその内容を持つ Result
     */
    static create(bookMemo: string | null | undefined): Result<BookMemo, BookMemoError> {
        const trimmedMemo = bookMemo?.trim();

        if (!trimmedMemo) {
            return ok(new BookMemo(null));
        }

        if (trimmedMemo.length > BookMemo.MEMO_MAX_LENGTH) {
            return err({ type: "BOOK_MEMO_TOO_LONG", max: BookMemo.MEMO_MAX_LENGTH });
        }

        return ok(new BookMemo(trimmedMemo));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param bookMemo 書籍メモ
     * @returns 書籍メモ
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(bookMemo: string | null | undefined): BookMemo {
        return BookMemo.create(bookMemo).match(
            (memo) => memo,
            (error) => { throw new Error(`書籍メモが不正です。type:${error.type}`); },
        );
    }
}
