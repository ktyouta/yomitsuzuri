import { describe, it, expect } from "vitest";
import { IconId } from "../../..";

describe("IconId", () => {
  describe("create", () => {
    it.each([IconId.MIN_VALUE, 10])("%s で生成できること", (iconId) => {
      expect(IconId.create(iconId)._unsafeUnwrap().value).toBe(iconId);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、ICON_ID_INVALID を返すこと", (iconId) => {
      expect(IconId.create(iconId)._unsafeUnwrapErr()).toEqual({ type: "ICON_ID_INVALID" });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(IconId.of(1).value).toBe(1);
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => IconId.of(0)).toThrow();
    });
  });
});
