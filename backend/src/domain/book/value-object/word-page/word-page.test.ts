import { describe, it, expect } from "vitest";
import { WordPage } from "../../..";

describe("WordPage", () => {
  describe("create", () => {
    it.each([1, 120])("%s で生成できること", (page) => {
      expect(WordPage.create(page)._unsafeUnwrap().value).toBe(page);
    });

    it.each([null, undefined])("%s の場合は null を保持すること", (page) => {
      expect(WordPage.create(page)._unsafeUnwrap().value).toBeNull();
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、WORD_PAGE_INVALID を下限値とともに返すこと", (page) => {
      expect(WordPage.create(page)._unsafeUnwrapErr()).toEqual({ type: "WORD_PAGE_INVALID", min: WordPage.MIN_VALUE });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WordPage.of(10).value).toBe(10);
      expect(WordPage.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WordPage.of(0)).toThrow();
    });
  });
});
