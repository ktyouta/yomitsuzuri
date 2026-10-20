import { describe, it, expect } from "vitest";
import { CharacterOccupation } from "../../..";

describe("CharacterOccupation", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(CharacterOccupation.create("高校の数学教師")._unsafeUnwrap().value).toBe("高校の数学教師");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(CharacterOccupation.create("  高校の数学教師\n")._unsafeUnwrap().value).toBe("高校の数学教師");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(CharacterOccupation.create("あ".repeat(CharacterOccupation.OCCUPATION_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(CharacterOccupation.OCCUPATION_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (value) => {
      expect(CharacterOccupation.create(value)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、CHARACTER_OCCUPATION_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(CharacterOccupation.create("あ".repeat(CharacterOccupation.OCCUPATION_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "CHARACTER_OCCUPATION_TOO_LONG",
        max: CharacterOccupation.OCCUPATION_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CharacterOccupation.of("高校の数学教師").value).toBe("高校の数学教師");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CharacterOccupation.of("あ".repeat(CharacterOccupation.OCCUPATION_MAX_LENGTH + 1))).toThrow();
    });
  });
});
