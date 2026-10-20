import { describe, it, expect } from "vitest";
import { CharacterMemo } from "../../..";

describe("CharacterMemo", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(CharacterMemo.create("アリバイが不自然")._unsafeUnwrap().value).toBe("アリバイが不自然");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(CharacterMemo.create("  アリバイが不自然\n")._unsafeUnwrap().value).toBe("アリバイが不自然");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(CharacterMemo.create("あ".repeat(CharacterMemo.MEMO_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(CharacterMemo.MEMO_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (value) => {
      expect(CharacterMemo.create(value)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、CHARACTER_MEMO_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(CharacterMemo.create("あ".repeat(CharacterMemo.MEMO_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "CHARACTER_MEMO_TOO_LONG",
        max: CharacterMemo.MEMO_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(CharacterMemo.of("アリバイが不自然").value).toBe("アリバイが不自然");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => CharacterMemo.of("あ".repeat(CharacterMemo.MEMO_MAX_LENGTH + 1))).toThrow();
    });
  });
});
