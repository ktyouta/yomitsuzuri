import { describe, it, expect } from "vitest";
import { PublishedDate } from "../../..";

describe("PublishedDate", () => {
  it("年のみ（YYYY）で生成できること", () => {
    expect(new PublishedDate("2024").value).toBe("2024");
  });

  it("年月（YYYY-MM）で生成できること", () => {
    expect(new PublishedDate("2024-05").value).toBe("2024-05");
  });

  it("年月日（YYYY-MM-DD）で生成できること", () => {
    expect(new PublishedDate("2024-05-01").value).toBe("2024-05-01");
  });

  it("うるう年の2月29日でも生成できること", () => {
    expect(new PublishedDate("2024-02-29").value).toBe("2024-02-29");
  });

  it("前後の空白を除去して保持すること", () => {
    expect(new PublishedDate(" 2024-05 ").value).toBe("2024-05");
  });

  it("nullの場合はnullを保持すること", () => {
    expect(new PublishedDate(null).value).toBeNull();
  });

  it("undefinedの場合はnullを保持すること", () => {
    expect(new PublishedDate(undefined).value).toBeNull();
  });

  it("空文字の場合はnullを保持すること", () => {
    expect(new PublishedDate("").value).toBeNull();
  });

  it("空白のみの場合はnullを保持すること", () => {
    expect(new PublishedDate("   ").value).toBeNull();
  });

  it("うるう年以外の2月29日でエラーになること", () => {
    expect(() => new PublishedDate("2023-02-29")).toThrow("出版日が正しくありません。");
  });

  it("存在しない日付（4月31日）でエラーになること", () => {
    expect(() => new PublishedDate("2024-04-31")).toThrow("出版日が正しくありません。");
  });

  it("スラッシュ形式でエラーになること", () => {
    expect(() => new PublishedDate("2024/05/01")).toThrow(
      "出版日の形式が不正です（YYYY / YYYY-MM / YYYY-MM-DD）。"
    );
  });

  it("区切りなし（YYYYMMDD）でエラーになること", () => {
    expect(() => new PublishedDate("20240501")).toThrow(
      "出版日の形式が不正です（YYYY / YYYY-MM / YYYY-MM-DD）。"
    );
  });

  it("月が1桁の場合にエラーになること", () => {
    expect(() => new PublishedDate("2024-5")).toThrow(
      "出版日の形式が不正です（YYYY / YYYY-MM / YYYY-MM-DD）。"
    );
  });

  it("月が13の場合にエラーになること", () => {
    expect(() => new PublishedDate("2024-13")).toThrow(
      "出版日の形式が不正です（YYYY / YYYY-MM / YYYY-MM-DD）。"
    );
  });

  it("日が32の場合にエラーになること", () => {
    expect(() => new PublishedDate("2024-01-32")).toThrow(
      "出版日の形式が不正です（YYYY / YYYY-MM / YYYY-MM-DD）。"
    );
  });
});
