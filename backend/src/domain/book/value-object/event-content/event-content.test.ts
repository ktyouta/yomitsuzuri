import { describe, it, expect } from "vitest";
import { EventContent } from "../../..";

describe("EventContent", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(EventContent.create("屋敷の主人が書斎で倒れているのが見つかる")._unsafeUnwrap().value).toBe("屋敷の主人が書斎で倒れているのが見つかる");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(EventContent.create("  屋敷の主人が書斎で倒れているのが見つかる\n")._unsafeUnwrap().value).toBe("屋敷の主人が書斎で倒れているのが見つかる");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(EventContent.create("あ".repeat(EventContent.CONTENT_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(EventContent.CONTENT_MAX_LENGTH);
    });

    it.each(["", "   "])("「%s」の場合、EVENT_CONTENT_EMPTY を返すこと", (content) => {
      expect(EventContent.create(content)._unsafeUnwrapErr()).toEqual({ type: "EVENT_CONTENT_EMPTY" });
    });

    it("上限文字数を超える場合、EVENT_CONTENT_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(EventContent.create("あ".repeat(EventContent.CONTENT_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "EVENT_CONTENT_TOO_LONG",
        max: EventContent.CONTENT_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(EventContent.of("屋敷の主人が書斎で倒れているのが見つかる").value).toBe("屋敷の主人が書斎で倒れているのが見つかる");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => EventContent.of("")).toThrow();
    });
  });
});
