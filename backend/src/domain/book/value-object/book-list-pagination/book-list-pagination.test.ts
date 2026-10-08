import { describe, it, expect } from "vitest";
import { BookListPagination } from "../../..";

describe("BookListPagination", () => {
  it("1以上の整数の場合、指定したページ番号を保持すること", () => {
    const pagination = new BookListPagination(2);
    expect(pagination.page).toBe(2);
  });

  it.each([0, -1, 1.5, NaN])("page=%sの場合、例外になること", (page) => {
    expect(() => new BookListPagination(page)).toThrow("ページ番号は1以上の整数で指定してください。");
  });
});
