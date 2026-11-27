import { describe, it, expect } from "vitest";
import { TagSortOrder } from "../../..";

describe("TagSortOrder", () => {
  describe("create", () => {
    it("1以上の整数で生成できること", () => {
      expect(TagSortOrder.create(1)._unsafeUnwrap().value).toBe(1);
      expect(TagSortOrder.create(2)._unsafeUnwrap().value).toBe(2);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、TAG_SORT_ORDER_INVALID を最小値とともに返すこと", (sortOrder) => {
      expect(TagSortOrder.create(sortOrder)._unsafeUnwrapErr()).toEqual({ type: "TAG_SORT_ORDER_INVALID", min: TagSortOrder.FIRST });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(TagSortOrder.of(3).value).toBe(3);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合は throw すること", (sortOrder) => {
      expect(() => TagSortOrder.of(sortOrder)).toThrow();
    });
  });
});
