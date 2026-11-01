import { describe, it, expect } from "vitest";
import { CharacterRelationName } from "../../..";

describe("CharacterRelationName", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(CharacterRelationName.create("兄")._unsafeUnwrap().value).toBe("兄");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(CharacterRelationName.create("  元婚約者　")._unsafeUnwrap().value).toBe("元婚約者");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(
        CharacterRelationName.create("あ".repeat(CharacterRelationName.RELATION_NAME_MAX_LENGTH))._unsafeUnwrap().value
      ).toHaveLength(CharacterRelationName.RELATION_NAME_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、CHARACTER_RELATION_NAME_EMPTY を返すこと", (relationName) => {
      expect(CharacterRelationName.create(relationName)._unsafeUnwrapErr()).toEqual({ type: "CHARACTER_RELATION_NAME_EMPTY" });
    });

    it("上限文字数を超える場合、CHARACTER_RELATION_NAME_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(
        CharacterRelationName.create("あ".repeat(CharacterRelationName.RELATION_NAME_MAX_LENGTH + 1))._unsafeUnwrapErr()
      ).toEqual({
        type: "CHARACTER_RELATION_NAME_TOO_LONG",
        max: CharacterRelationName.RELATION_NAME_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CharacterRelationName.of("兄").value).toBe("兄");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CharacterRelationName.of("")).toThrow();
    });
  });
});
