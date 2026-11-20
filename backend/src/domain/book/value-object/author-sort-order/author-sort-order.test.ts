import { describe, it, expect } from "vitest";
import { AuthorSortOrder } from "../../..";

describe("AuthorSortOrder", () => {
  describe("create", () => {
    it("1以上の整数で生成できること", () => {
      expect(AuthorSortOrder.create(1)._unsafeUnwrap().value).toBe(1);
      expect(AuthorSortOrder.create(2)._unsafeUnwrap().value).toBe(2);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、AUTHOR_SORT_ORDER_INVALID を最小値とともに返すこと", (sortOrder) => {
      expect(AuthorSortOrder.create(sortOrder)._unsafeUnwrapErr()).toEqual({ type: "AUTHOR_SORT_ORDER_INVALID", min: AuthorSortOrder.FIRST });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(AuthorSortOrder.of(3).value).toBe(3);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合は throw すること", (sortOrder) => {
      expect(() => AuthorSortOrder.of(sortOrder)).toThrow();
    });
  });
});
