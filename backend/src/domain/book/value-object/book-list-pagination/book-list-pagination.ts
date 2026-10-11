import { err, ok, type Result } from "neverthrow";

/**
 * 書籍一覧のページング条件の生成失敗
 */
export type BookListPaginationError = { type: "BOOK_LIST_PAGE_INVALID"; min: number };

/**
 * 書籍一覧のページング条件
 */
export class BookListPagination {

    static readonly MIN_PAGE = 1;
    private readonly _value: number;

    /**
     * @param page ページ番号（1始まり）
     */
    private constructor(page: number) {
        this._value = page;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する
     * @param page ページ番号（1始まり）
     * @returns 成功時はページング条件、MIN_PAGE 以上の整数でない場合（NaN を含む）はその内容を持つ Result
     */
    static create(page: number): Result<BookListPagination, BookListPaginationError> {
        if (!Number.isInteger(page) || page < BookListPagination.MIN_PAGE) {
            return err({ type: "BOOK_LIST_PAGE_INVALID", min: BookListPagination.MIN_PAGE });
        }

        return ok(new BookListPagination(page));
    }
}
