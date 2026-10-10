import { describe, it, expect } from "vitest";
import { PublishedDate } from "../../..";

describe("PublishedDate", () => {
  describe("create", () => {
    it.each(["2024", "2024-05", "2024-05-01", "2024-02-29"])("「%s」で生成できること", (date) => {
      expect(PublishedDate.create(date)._unsafeUnwrap().value).toBe(date);
    });

    it("前後の空白を除去して保持すること", () => {
      expect(PublishedDate.create(" 2024-05 ")._unsafeUnwrap().value).toBe("2024-05");
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (date) => {
      expect(PublishedDate.create(date)._unsafeUnwrap().value).toBeNull();
    });

    it.each(["2024/05/01", "20240501", "2024-5", "2024-13", "2024-01-32"])("「%s」の場合、PUBLISHED_DATE_INVALID_FORMAT を返すこと", (date) => {
      expect(PublishedDate.create(date)._unsafeUnwrapErr()).toEqual({ type: "PUBLISHED_DATE_INVALID_FORMAT" });
    });

    it.each(["2023-02-29", "2024-04-31"])("「%s」の場合、PUBLISHED_DATE_NOT_EXIST を返すこと", (date) => {
      expect(PublishedDate.create(date)._unsafeUnwrapErr()).toEqual({ type: "PUBLISHED_DATE_NOT_EXIST" });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(PublishedDate.of("2024-05").value).toBe("2024-05");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => PublishedDate.of("2024/05")).toThrow();
    });
  });
});
