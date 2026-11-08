import { afterEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "..";

describe("Timestamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("create", () => {
    it("現在日時を toISOString() の形式で持つこと", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-01-02T03:04:05.678Z"));

      expect(Timestamp.create().value).toBe("2026-01-02T03:04:05.678Z");
    });
  });

  describe("fromInput", () => {
    it("toISOString() の形式の場合、その値を持つこと", () => {
      expect(Timestamp.fromInput("2026-01-02T03:04:05.678Z")._unsafeUnwrap().value).toBe("2026-01-02T03:04:05.678Z");
    });

    it.each([
      "",
      "2026-01-02",
      "2026-01-02T03:04:05Z",
      "2026-01-02T03:04:05.678",
      "2026-01-02T03:04:05.678+09:00",
      "invalid",
    ])("形式が異なる場合（%s）、TIMESTAMP_INVALID を返すこと", (value) => {
      expect(Timestamp.fromInput(value)._unsafeUnwrapErr()).toEqual({ type: "TIMESTAMP_INVALID" });
    });

    it.each([
      "2026-02-30T00:00:00.000Z",
      "2026-13-01T00:00:00.000Z",
      "2026-01-01T24:00:00.000Z",
    ])("実在しない日時の場合（%s）、TIMESTAMP_INVALID を返すこと", (value) => {
      expect(Timestamp.fromInput(value)._unsafeUnwrapErr()).toEqual({ type: "TIMESTAMP_INVALID" });
    });
  });

  describe("of", () => {
    it("toISOString() の形式の場合、その値を持つこと", () => {
      expect(Timestamp.of("2026-01-02T03:04:05.678Z").value).toBe("2026-01-02T03:04:05.678Z");
    });

    it("形式が不正な場合は throw すること", () => {
      expect(() => Timestamp.of("invalid")).toThrow();
    });
  });

  describe("equals", () => {
    it("同じ日時の場合は true、異なる日時の場合は false を返すこと", () => {
      const timestamp = Timestamp.of("2026-01-02T03:04:05.678Z");

      expect(timestamp.equals(Timestamp.of("2026-01-02T03:04:05.678Z"))).toBe(true);
      expect(timestamp.equals(Timestamp.of("2026-01-02T03:04:05.679Z"))).toBe(false);
    });
  });
});
