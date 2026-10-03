import { describe, it, expect } from "vitest";
import { BookListPagination } from "../../../../src/domain";

describe("BookListPagination", () => {
  it("page=1の場合、offsetが0、limitが30になること", () => {
    const pagination = new BookListPagination(1);
    expect(pagination.page).toBe(1);
    expect(pagination.offset).toBe(0);
    expect(pagination.limit).toBe(30);
  });

  it("page=2の場合、offsetが30になること", () => {
    const pagination = new BookListPagination(2);
    expect(pagination.offset).toBe(30);
  });

  it.each([0, -1, 1.5, NaN])("page=%sの場合、例外になること", (page) => {
    expect(() => new BookListPagination(page)).toThrow("ページ番号は1以上の整数で指定してください。");
  });

  it.each([
    [0, 0],
    [1, 1],
    [30, 1],
    [31, 2],
  ])("total=%sの場合、totalPagesが%sになること", (total, expected) => {
    const pagination = new BookListPagination(1);
    expect(pagination.totalPages(total)).toBe(expected);
  });

  it.each([-1, 1.5])("totalPagesにtotal=%sを渡した場合、例外になること", (total) => {
    const pagination = new BookListPagination(1);
    expect(() => pagination.totalPages(total)).toThrow("全件数は0以上の整数で指定してください。");
  });
});
