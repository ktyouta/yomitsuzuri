import { describe, it, expect } from "vitest";
import { BookListSort } from "../../..";

describe("BookListSort", () => {
  describe("DEFAULT", () => {
    it("更新日時の降順を保持すること", () => {
      expect(BookListSort.DEFAULT.value).toBe("updatedAtDesc");
    });
  });

  describe("create", () => {
    it.each(BookListSort.SORTS)("%s の場合、指定した並び順を保持すること", (sort) => {
      expect(BookListSort.create(sort)._unsafeUnwrap().value).toBe(sort);
    });

    it.each([undefined, ""])("%s の場合、既定の並び順を返すこと", (sort) => {
      expect(BookListSort.create(sort)._unsafeUnwrap()).toBe(BookListSort.DEFAULT);
    });

    it.each(["abc", "UpdatedAtDesc", "updatedAt", " updatedAtDesc"])("%s の場合、BOOK_LIST_SORT_INVALID を返すこと", (sort) => {
      expect(BookListSort.create(sort)._unsafeUnwrapErr()).toEqual({ type: "BOOK_LIST_SORT_INVALID" });
    });
  });
});
