import { describe, it, expect } from "vitest";
import { WordMemo } from "../../..";

describe("WordMemo", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(WordMemo.create("第3章で再登場する")._unsafeUnwrap().value).toBe("第3章で再登場する");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(WordMemo.create("  第3章で再登場する\n")._unsafeUnwrap().value).toBe("第3章で再登場する");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(WordMemo.create("あ".repeat(WordMemo.MEMO_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(WordMemo.MEMO_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (value) => {
      expect(WordMemo.create(value)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、WORD_MEMO_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(WordMemo.create("あ".repeat(WordMemo.MEMO_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "WORD_MEMO_TOO_LONG",
        max: WordMemo.MEMO_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WordMemo.of("第3章で再登場する").value).toBe("第3章で再登場する");
      expect(WordMemo.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WordMemo.of("あ".repeat(WordMemo.MEMO_MAX_LENGTH + 1))).toThrow();
    });
  });
});
