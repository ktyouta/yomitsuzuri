import { describe, it, expect } from "vitest";
import { CurrentPage } from "../../..";

describe("CurrentPage", () => {
  describe("create", () => {
    it.each([0, 120])("%s で生成できること", (page) => {
      expect(CurrentPage.create(page)._unsafeUnwrap().value).toBe(page);
    });

    it.each([null, undefined])("%s の場合は null を保持すること", (page) => {
      expect(CurrentPage.create(page)._unsafeUnwrap().value).toBeNull();
    });

    it.each([-1, 1.5, NaN])("%s の場合、CURRENT_PAGE_INVALID を下限値とともに返すこと", (page) => {
      expect(CurrentPage.create(page)._unsafeUnwrapErr()).toEqual({ type: "CURRENT_PAGE_INVALID", min: CurrentPage.MIN_VALUE });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CurrentPage.of(10).value).toBe(10);
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CurrentPage.of(-1)).toThrow();
    });
  });
});
