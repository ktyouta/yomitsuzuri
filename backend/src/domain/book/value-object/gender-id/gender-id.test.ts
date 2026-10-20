import { describe, it, expect } from "vitest";
import { GenderId } from "../../..";

describe("GenderId", () => {
  describe("create", () => {
    it("1以上の整数で生成できること", () => {
      expect(GenderId.create(1)._unsafeUnwrap().value).toBe(1);
    });

    it.each([null, undefined])("%j の場合は null を保持すること", (genderId) => {
      expect(GenderId.create(genderId)._unsafeUnwrap().value).toBeNull();
    });

    it.each([0, -1, 1.5])("%d の場合、GENDER_ID_INVALID を返すこと", (genderId) => {
      expect(GenderId.create(genderId)._unsafeUnwrapErr()).toEqual({ type: "GENDER_ID_INVALID" });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(GenderId.of(2).value).toBe(2);
    });

    it("null で生成できること", () => {
      expect(GenderId.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => GenderId.of(0)).toThrow();
    });
  });
});
