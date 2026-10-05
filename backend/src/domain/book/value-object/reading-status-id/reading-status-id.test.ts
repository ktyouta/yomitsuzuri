import { describe, it, expect } from "vitest";
import { ReadingStatusId } from "../../..";

describe("ReadingStatusId", () => {
  it("1以上の整数でインスタンスを生成できること", () => {
    const readingStatusId = ReadingStatusId.of(1);
    expect(readingStatusId.value).toBe(1);
  });

  it("0でエラーになること", () => {
    expect(() => ReadingStatusId.of(0)).toThrow("読書状況IDが不正です。readingStatusId:0");
  });

  it("負の数でエラーになること", () => {
    expect(() => ReadingStatusId.of(-1)).toThrow("読書状況IDが不正です。readingStatusId:-1");
  });

  it("小数でエラーになること", () => {
    expect(() => ReadingStatusId.of(1.5)).toThrow("読書状況IDが不正です。readingStatusId:1.5");
  });

  it("NaNでエラーになること", () => {
    expect(() => ReadingStatusId.of(NaN)).toThrow("読書状況IDが不正です。readingStatusId:NaN");
  });

  it("初期値は1（未読）であること", () => {
    expect(ReadingStatusId.initial().value).toBe(1);
  });
});
