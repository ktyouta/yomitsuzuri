import { describe, it, expect } from "vitest";
import { BookListPagination } from "../../..";

describe("BookListPagination", () => {
  describe("create", () => {
    it("1以上の整数の場合、指定したページ番号を保持すること", () => {
      expect(BookListPagination.create(2)._unsafeUnwrap().value).toBe(2);
    });

    it.each([0, -1, 1.5, NaN])("page=%s の場合、BOOK_LIST_PAGE_INVALID を最小値とともに返すこと", (page) => {
      expect(BookListPagination.create(page)._unsafeUnwrapErr()).toEqual({
        type: "BOOK_LIST_PAGE_INVALID",
        min: BookListPagination.MIN_PAGE,
      });
    });
  });
});
