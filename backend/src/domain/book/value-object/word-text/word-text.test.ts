import { describe, it, expect } from "vitest";
import { WordText } from "../../..";

describe("WordText", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(WordText.create("赤い手帳")._unsafeUnwrap().value).toBe("赤い手帳");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(WordText.create("  赤い手帳　")._unsafeUnwrap().value).toBe("赤い手帳");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(WordText.create("あ".repeat(WordText.WORD_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(WordText.WORD_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、WORD_EMPTY を返すこと", (word) => {
      expect(WordText.create(word)._unsafeUnwrapErr()).toEqual({ type: "WORD_EMPTY" });
    });

    it("上限文字数を超える場合、WORD_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(WordText.create("あ".repeat(WordText.WORD_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "WORD_TOO_LONG",
        max: WordText.WORD_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WordText.of("赤い手帳").value).toBe("赤い手帳");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WordText.of("")).toThrow();
    });
  });
});
