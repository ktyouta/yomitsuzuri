import { describe, it, expect } from "vitest";
import { ReadingStatusId } from "../../..";

describe("ReadingStatusId", () => {
  describe("create", () => {
    it("1以上の整数で生成できること", () => {
      expect(ReadingStatusId.create(1)._unsafeUnwrap().value).toBe(1);
    });

    it.each([0, -1, 1.5, NaN])("%s の場合、READING_STATUS_ID_INVALID を返すこと", (readingStatusId) => {
      expect(ReadingStatusId.create(readingStatusId)._unsafeUnwrapErr()).toEqual({ type: "READING_STATUS_ID_INVALID" });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(ReadingStatusId.of(2).value).toBe(2);
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => ReadingStatusId.of(0)).toThrow();
    });
  });

  it("初期値は1（未読）であること", () => {
    expect(ReadingStatusId.initial().value).toBe(1);
  });
});
