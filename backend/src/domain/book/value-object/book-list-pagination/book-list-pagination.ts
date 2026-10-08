/**
 * 書籍一覧のページング条件
 */
export class BookListPagination {

    static readonly MIN_PAGE = 1;

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
}
