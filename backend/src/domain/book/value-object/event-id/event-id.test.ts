import { describe, it, expect } from "vitest";
import { EventId } from "../../..";

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("EventId", () => {
  describe("of", () => {
    it.each(["01ARZ3NDEKTSV4RRFFQ69G5FAV", "invalid"])("空でなければ（%s）、そのまま保持すること（形式は判定しない）", (eventId) => {
      expect(EventId.of(eventId).value).toBe(eventId);
    });

    it("空の場合は throw すること", () => {
      expect(() => EventId.of("")).toThrow();
    });
  });

  describe("create", () => {
    it("ULID 形式の ID を生成すること", () => {
      expect(EventId.create().value).toMatch(ULID_PATTERN);
    });

    it("毎回異なるIDを生成すること", () => {
      expect(EventId.create().value).not.toBe(EventId.create().value);
    });
  });
});
