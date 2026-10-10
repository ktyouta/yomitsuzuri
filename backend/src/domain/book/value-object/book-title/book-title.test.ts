import { describe, it, expect } from "vitest";
import { BookTitle } from "../../..";

describe("BookTitle", () => {
  describe("create", () => {
    it("正常なタイトルで生成できること", () => {
      expect(BookTitle.create("容疑者Xの献身")._unsafeUnwrap().value).toBe("容疑者Xの献身");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(BookTitle.create("  容疑者Xの献身　")._unsafeUnwrap().value).toBe("容疑者Xの献身");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(BookTitle.create("あ".repeat(BookTitle.TITLE_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(BookTitle.TITLE_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、BOOK_TITLE_EMPTY を返すこと", (title) => {
      expect(BookTitle.create(title)._unsafeUnwrapErr()).toEqual({ type: "BOOK_TITLE_EMPTY" });
    });

    it("上限文字数を超える場合、BOOK_TITLE_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(BookTitle.create("あ".repeat(BookTitle.TITLE_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "BOOK_TITLE_TOO_LONG",
        max: BookTitle.TITLE_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(BookTitle.of("容疑者Xの献身").value).toBe("容疑者Xの献身");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => BookTitle.of("")).toThrow();
    });
  });
});
