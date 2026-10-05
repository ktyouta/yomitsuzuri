import { describe, it, expect } from "vitest";
import { CurrentPage } from "../../..";

describe("CurrentPage", () => {
  it("0以上の整数でインスタンスを生成できること", () => {
    expect(new CurrentPage(0).value).toBe(0);
    expect(new CurrentPage(120).value).toBe(120);
  });

  it("nullの場合はnullとして保持すること", () => {
    expect(new CurrentPage(null).value).toBeNull();
  });

  it("undefinedの場合はnullとして保持すること", () => {
    expect(new CurrentPage(undefined).value).toBeNull();
  });

  it("負の数でエラーになること", () => {
    expect(() => new CurrentPage(-1)).toThrow("現在の読書ページ数が不正です。");
  });

  it("小数でエラーになること", () => {
    expect(() => new CurrentPage(1.5)).toThrow("現在の読書ページ数が不正です。");
  });

  it("NaNでエラーになること", () => {
    expect(() => new CurrentPage(NaN)).toThrow("現在の読書ページ数が不正です。");
  });
});
