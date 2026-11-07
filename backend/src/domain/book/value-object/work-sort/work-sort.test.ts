import { describe, it, expect } from "vitest";
import { WorkSort } from "../../..";

describe("WorkSort", () => {
  describe("create", () => {
    it("1以上の整数で生成できること", () => {
      expect(WorkSort.create(1)._unsafeUnwrap().value).toBe(1);
      expect(WorkSort.create(2)._unsafeUnwrap().value).toBe(2);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、WORK_SORT_INVALID を最小値とともに返すこと", (sort) => {
      expect(WorkSort.create(sort)._unsafeUnwrapErr()).toEqual({ type: "WORK_SORT_INVALID", min: WorkSort.FIRST });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WorkSort.of(3).value).toBe(3);
    });

    it("null の場合、表示順を持たない値で生成できること", () => {
      expect(WorkSort.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WorkSort.of(0)).toThrow();
    });
  });

  it("先頭の表示順は1であること", () => {
    expect(WorkSort.first().value).toBe(1);
  });

  describe("reset", () => {
    it("表示順を持たない値を返し、自身は変更しないこと", () => {
      const sort = WorkSort.of(3);

      const reset = sort.reset();

      expect(reset.value).toBeNull();
      expect(sort.value).toBe(3);
    });
  });
});
