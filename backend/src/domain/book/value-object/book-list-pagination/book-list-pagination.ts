/**
 * 書籍一覧のページング条件
 */
export class BookListPagination {

    static readonly MIN_PAGE = 1;
    static readonly PAGE_SIZE = 30;

    private readonly _page: number;

    /**
     * @param page ページ番号（1始まり）
     * @throws page が MIN_PAGE 以上の整数でない場合
     */
    constructor(page: number) {
        if (!Number.isInteger(page) || page < BookListPagination.MIN_PAGE) {
            throw new Error("ページ番号は1以上の整数で指定してください。");
        }

        this._page = page;
    }

    get page() {
        return this._page;
    }

    get limit() {
        return BookListPagination.PAGE_SIZE;
    }

    get offset() {
        return (this._page - BookListPagination.MIN_PAGE) * BookListPagination.PAGE_SIZE;
    }

    /**
     * 総ページ数を算出する
     * @param total 全件数
     * @returns 総ページ数（0件の場合は0）
     * @throws total が0以上の整数でない場合
     */
    totalPages(total: number): number {
        if (!Number.isInteger(total) || total < 0) {
            throw new Error("全件数は0以上の整数で指定してください。");
        }

        return Math.ceil(total / BookListPagination.PAGE_SIZE);
    }
}
