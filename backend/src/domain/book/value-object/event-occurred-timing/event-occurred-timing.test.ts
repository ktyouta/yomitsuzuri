import { describe, it, expect } from "vitest";
import { EventOccurredTiming } from "../../..";

describe("EventOccurredTiming", () => {
  describe("create", () => {
    it("正常な値で生成できること", () => {
      expect(EventOccurredTiming.create("3日目の夜")._unsafeUnwrap().value).toBe("3日目の夜");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(EventOccurredTiming.create("  3日目の夜\n")._unsafeUnwrap().value).toBe("3日目の夜");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(EventOccurredTiming.create("あ".repeat(EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (value) => {
      expect(EventOccurredTiming.create(value)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、EVENT_OCCURRED_TIMING_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(EventOccurredTiming.create("あ".repeat(EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "EVENT_OCCURRED_TIMING_TOO_LONG",
        max: EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(EventOccurredTiming.of("3日目の夜").value).toBe("3日目の夜");
      expect(EventOccurredTiming.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => EventOccurredTiming.of("あ".repeat(EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH + 1))).toThrow();
    });
  });
});
