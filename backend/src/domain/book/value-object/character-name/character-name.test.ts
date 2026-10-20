import { describe, it, expect } from "vitest";
import { CharacterName } from "../../..";

describe("CharacterName", () => {
  describe("create", () => {
    it("正常な名前で生成できること", () => {
      expect(CharacterName.create("石神哲哉")._unsafeUnwrap().value).toBe("石神哲哉");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(CharacterName.create("  石神哲哉　")._unsafeUnwrap().value).toBe("石神哲哉");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(CharacterName.create("あ".repeat(CharacterName.NAME_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(CharacterName.NAME_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、CHARACTER_NAME_EMPTY を返すこと", (name) => {
      expect(CharacterName.create(name)._unsafeUnwrapErr()).toEqual({ type: "CHARACTER_NAME_EMPTY" });
    });

    it("上限文字数を超える場合、CHARACTER_NAME_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(CharacterName.create("あ".repeat(CharacterName.NAME_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "CHARACTER_NAME_TOO_LONG",
        max: CharacterName.NAME_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CharacterName.of("石神哲哉").value).toBe("石神哲哉");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CharacterName.of("")).toThrow();
    });
  });
});
