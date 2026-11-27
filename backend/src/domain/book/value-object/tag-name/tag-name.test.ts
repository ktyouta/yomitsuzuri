import { describe, it, expect } from "vitest";
import { TagName } from "../../..";

describe("TagName", () => {
  describe("create", () => {
    it("正常なタグ名で生成できること", () => {
      expect(TagName.create("叙述トリック")._unsafeUnwrap().value).toBe("叙述トリック");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(TagName.create("  叙述トリック　")._unsafeUnwrap().value).toBe("叙述トリック");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(TagName.create("あ".repeat(TagName.NAME_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(TagName.NAME_MAX_LENGTH);
    });

    it("前後の空白を除去した後の文字数で上限を判定すること", () => {
      expect(TagName.create(` ${"あ".repeat(TagName.NAME_MAX_LENGTH)} `)._unsafeUnwrap().value).toHaveLength(TagName.NAME_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、TAG_NAME_EMPTY を返すこと", (tagName) => {
      expect(TagName.create(tagName)._unsafeUnwrapErr()).toEqual({ type: "TAG_NAME_EMPTY" });
    });

    it("上限文字数を超える場合、TAG_NAME_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(TagName.create("あ".repeat(TagName.NAME_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "TAG_NAME_TOO_LONG",
        max: TagName.NAME_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(TagName.of("叙述トリック").value).toBe("叙述トリック");
    });

    it.each(["", "あ".repeat(TagName.NAME_MAX_LENGTH + 1)])("制約を満たさない値「%s」の場合は throw すること", (tagName) => {
      expect(() => TagName.of(tagName)).toThrow();
    });
  });
});
