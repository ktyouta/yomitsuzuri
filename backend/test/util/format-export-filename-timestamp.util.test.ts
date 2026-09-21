import { describe, expect, it } from "vitest";
import { formatExportFilenameTimestamp } from "../../src/util";

describe("formatExportFilenameTimestamp", () => {
  it("UTCの時刻が日本標準時（UTC+9）に変換されてYYYYMMDDHHmmss形式になること", () => {
    const date = new Date("2026-01-02T03:04:05.000Z");

    expect(formatExportFilenameTimestamp(date)).toBe("20260102120405");
  });

  it("日付をまたぐ場合に日本標準時の日付で出力されること", () => {
    const date = new Date("2026-12-31T20:00:00.000Z");

    expect(formatExportFilenameTimestamp(date)).toBe("20270101050000");
  });
});
