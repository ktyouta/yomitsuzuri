import { err, ok, type Result } from "neverthrow";

/**
 * 書籍タイトルの生成失敗
 */
export type BookTitleError = { type: "BOOK_TITLE_EMPTY" }
    | { type: "BOOK_TITLE_TOO_LONG"; max: number };

/**
 * 書籍タイトル
 */
export class BookTitle {

    static readonly TITLE_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param bookTitle 前後の空白を除去済みの書籍タイトル
     */
    private constructor(bookTitle: string) {
        this._value = bookTitle;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param bookTitle 書籍タイトル
     * @returns 成功時は書籍タイトル、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(bookTitle: string): Result<BookTitle, BookTitleError> {
        const trimmedTitle = bookTitle.trim();

        if (!trimmedTitle) {
            return err({ type: "BOOK_TITLE_EMPTY" });
        }

        if (trimmedTitle.length > BookTitle.TITLE_MAX_LENGTH) {
            return err({ type: "BOOK_TITLE_TOO_LONG", max: BookTitle.TITLE_MAX_LENGTH });
        }

        return ok(new BookTitle(trimmedTitle));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param bookTitle 書籍タイトル
     * @returns 書籍タイトル
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(bookTitle: string): BookTitle {
        return BookTitle.create(bookTitle).match(
            (title) => title,
            (error) => { throw new Error(`書籍タイトルが不正です。type:${error.type}`); },
        );
    }
}
