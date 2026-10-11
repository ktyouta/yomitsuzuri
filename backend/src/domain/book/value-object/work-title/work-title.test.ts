import { describe, it, expect } from "vitest";
import { BookTitle, WorkTitle } from "../../..";

describe("WorkTitle", () => {
  describe("create", () => {
    it("正常なタイトルで生成できること", () => {
      expect(WorkTitle.create("容疑者Xの献身")._unsafeUnwrap().value).toBe("容疑者Xの献身");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(WorkTitle.create("  容疑者Xの献身　")._unsafeUnwrap().value).toBe("容疑者Xの献身");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(WorkTitle.create("あ".repeat(WorkTitle.TITLE_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(WorkTitle.TITLE_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、WORK_TITLE_EMPTY を返すこと", (title) => {
      expect(WorkTitle.create(title)._unsafeUnwrapErr()).toEqual({ type: "WORK_TITLE_EMPTY" });
    });

    it("上限文字数を超える場合、WORK_TITLE_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(WorkTitle.create("あ".repeat(WorkTitle.TITLE_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "WORK_TITLE_TOO_LONG",
        max: WorkTitle.TITLE_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WorkTitle.of("容疑者Xの献身").value).toBe("容疑者Xの献身");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WorkTitle.of("")).toThrow();
    });
  });

  describe("initial", () => {
    it("書籍タイトルと同じ値の作品タイトルを生成すること", () => {
      expect(WorkTitle.initial(BookTitle.of("容疑者Xの献身")).value).toBe("容疑者Xの献身");
    });

    it("書籍タイトルの上限文字数が作品タイトルの上限文字数以下であること（initial の前提）", () => {
      expect(BookTitle.TITLE_MAX_LENGTH).toBeLessThanOrEqual(WorkTitle.TITLE_MAX_LENGTH);
    });

    it("上限文字数ちょうどの書籍タイトルから生成できること", () => {
      const bookTitle = BookTitle.of("あ".repeat(BookTitle.TITLE_MAX_LENGTH));
      expect(WorkTitle.initial(bookTitle).value).toBe(bookTitle.value);
    });
  });
});
