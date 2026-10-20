import { describe, it, expect } from "vitest";
import { CharacterAge } from "../../..";

describe("CharacterAge", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(CharacterAge.create("30代")._unsafeUnwrap().value).toBe("30代");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(CharacterAge.create("  30代\n")._unsafeUnwrap().value).toBe("30代");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(CharacterAge.create("あ".repeat(CharacterAge.AGE_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(CharacterAge.AGE_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (value) => {
      expect(CharacterAge.create(value)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、CHARACTER_AGE_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(CharacterAge.create("あ".repeat(CharacterAge.AGE_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "CHARACTER_AGE_TOO_LONG",
        max: CharacterAge.AGE_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CharacterAge.of("30代").value).toBe("30代");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CharacterAge.of("あ".repeat(CharacterAge.AGE_MAX_LENGTH + 1))).toThrow();
    });
  });
});
