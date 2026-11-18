import { describe, it, expect } from "vitest";
import { AuthorName } from "../../..";

describe("AuthorName", () => {
  describe("create", () => {
    it("正常な名前で生成できること", () => {
      expect(AuthorName.create("夏目漱石")._unsafeUnwrap().value).toBe("夏目漱石");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(AuthorName.create("  夏目漱石　")._unsafeUnwrap().value).toBe("夏目漱石");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(AuthorName.create("あ".repeat(AuthorName.NAME_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(AuthorName.NAME_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、AUTHOR_NAME_EMPTY を返すこと", (name) => {
      expect(AuthorName.create(name)._unsafeUnwrapErr()).toEqual({ type: "AUTHOR_NAME_EMPTY" });
    });

    it("上限文字数を超える場合、AUTHOR_NAME_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(AuthorName.create("あ".repeat(AuthorName.NAME_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "AUTHOR_NAME_TOO_LONG",
        max: AuthorName.NAME_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(AuthorName.of("夏目漱石").value).toBe("夏目漱石");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => AuthorName.of("")).toThrow();
    });
  });
});
