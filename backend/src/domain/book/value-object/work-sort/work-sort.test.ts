import { describe, it, expect } from "vitest";
import { WorkSort } from "../../..";

describe("WorkSort", () => {
  it("1以上の整数でインスタンスを生成できること", () => {
    expect(WorkSort.of(1).value).toBe(1);
    expect(WorkSort.of(2).value).toBe(2);
  });

  it("0でエラーになること", () => {
    expect(() => WorkSort.of(0)).toThrow("表示順が不正です。sort:0");
  });

  it("負の数でエラーになること", () => {
    expect(() => WorkSort.of(-1)).toThrow("表示順が不正です。sort:-1");
  });

  it("小数でエラーになること", () => {
    expect(() => WorkSort.of(1.5)).toThrow("表示順が不正です。sort:1.5");
  });

  it("NaNでエラーになること", () => {
    expect(() => WorkSort.of(NaN)).toThrow("表示順が不正です。sort:NaN");
  });

  it("先頭の表示順は1であること", () => {
    expect(WorkSort.first().value).toBe(1);
  });
});
