import { describe, it, expect } from "vitest";
import { WorkId } from "../../..";

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("WorkId", () => {
  describe("of", () => {
    it.each(["01ARZ3NDEKTSV4RRFFQ69G5FAV", "invalid"])("空でなければ（%s）、そのまま保持すること（形式は判定しない）", (workId) => {
      expect(WorkId.of(workId).value).toBe(workId);
    });

    it("空の場合は throw すること", () => {
      expect(() => WorkId.of("")).toThrow();
    });
  });

  describe("create", () => {
    it("ULID 形式の ID を生成すること", () => {
      expect(WorkId.create().value).toMatch(ULID_PATTERN);
    });

    it("毎回異なるIDを生成すること", () => {
      expect(WorkId.create().value).not.toBe(WorkId.create().value);
    });
  });
});
