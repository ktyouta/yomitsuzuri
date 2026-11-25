import { err, ok, type Result } from "neverthrow";

/**
 * 書籍一覧の並び順の生成失敗
 */
export type BookListSortError = { type: "BOOK_LIST_SORT_INVALID" };

/**
 * 書籍一覧の並び順の種類
 */
export type BookListSortType = typeof BookListSort.SORTS[number];

/**
 * 書籍一覧の並び順
 */
export class BookListSort {

    static readonly SORTS = [
        "updatedAtDesc",
        "updatedAtAsc",
        "createdAtDesc",
        "createdAtAsc",
    ] as const;
    private readonly _value: BookListSortType;

    /**
     * @param sort 並び順の種類
     */
    private constructor(sort: BookListSortType) {
        this._value = sort;
    }

    get value() {
        return this._value;
    }

    /**
     * 既定の並び順（更新日時の降順。並び順の指定がない場合・不正な場合に使う）
     */
    static readonly DEFAULT = new BookListSort("updatedAtDesc");

    /**
     * 外部からの入力値から生成する
     * @param sort 並び順の種類（省略可）
     * @returns 成功時は並び順（省略時は既定の並び順）、SORTS に含まれない値の場合はその内容を持つ Result
     */
    static create(sort: string | undefined): Result<BookListSort, BookListSortError> {
        if (!sort) {
            return ok(BookListSort.DEFAULT);
        }

        const value = BookListSort.SORTS.find((e) => e === sort);
        if (!value) {
            return err({ type: "BOOK_LIST_SORT_INVALID" });
        }

        return ok(new BookListSort(value));
    }
}
