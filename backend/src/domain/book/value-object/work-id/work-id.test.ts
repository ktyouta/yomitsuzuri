import { describe, it, expect } from "vitest";
import { WorkId } from "../../..";

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("WorkId", () => {
  describe("create", () => {
    it("ULID 形式の文字列で生成できること", () => {
      expect(WorkId.create("01ARZ3NDEKTSV4RRFFQ69G5FAV")._unsafeUnwrap().value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    });

    it.each([
      ["空文字", ""],
      ["25文字", "01ARZ3NDEKTSV4RRFFQ69G5FA"],
      ["27文字", "01ARZ3NDEKTSV4RRFFQ69G5FAVX"],
      ["I を含む", "01ARZ3NDEKTSV4RRFFQ69G5FAI"],
      ["L を含む", "01ARZ3NDEKTSV4RRFFQ69G5FAL"],
      ["O を含む", "01ARZ3NDEKTSV4RRFFQ69G5FAO"],
      ["U を含む", "01ARZ3NDEKTSV4RRFFQ69G5FAU"],
      ["小文字を含む", "01arz3ndektsv4rrffq69g5fav"],
    ])("%s の場合、WORK_ID_INVALID を返すこと", (_, workId) => {
      expect(WorkId.create(workId)._unsafeUnwrapErr()).toEqual({ type: "WORK_ID_INVALID" });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV").value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WorkId.of("invalid")).toThrow();
    });
  });

  describe("generate", () => {
    it("ULID 形式の ID を生成すること", () => {
      expect(WorkId.generate().value).toMatch(ULID_PATTERN);
    });

    it("毎回異なるIDを生成すること", () => {
      expect(WorkId.generate().value).not.toBe(WorkId.generate().value);
    });
  });
});
