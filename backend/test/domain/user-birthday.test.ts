import { describe, it, expect } from "vitest";
import { UserBirthday } from "../../src/domain";

describe("UserBirthday", () => {
  it("正常な日付でインスタンスを生成できること", () => {
    const birthday = new UserBirthday("19900101");
    expect(birthday.value).toBe("19900101");
  });

  it("月末日でも生成できること", () => {
    const birthday = new UserBirthday("20001231");
    expect(birthday.value).toBe("20001231");
  });

  it("うるう年の2月29日でも生成できること", () => {
    const birthday = new UserBirthday("20000229");
    expect(birthday.value).toBe("20000229");
  });

  it("うるう年以外の2月29日でエラーになること", () => {
    expect(() => new UserBirthday("19990229")).toThrow("生年月日が正しくありません");
  });

  it("存在しない日付（4月31日）でエラーになること", () => {
    expect(() => new UserBirthday("20000431")).toThrow("生年月日が正しくありません");
  });

  it("ハイフン形式でエラーになること", () => {
    expect(() => new UserBirthday("1990-01-01")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("スラッシュ形式でエラーになること", () => {
    expect(() => new UserBirthday("1990/01/01")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("桁数が足りない場合にエラーになること", () => {
    expect(() => new UserBirthday("1990101")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("月が00の場合にエラーになること", () => {
    expect(() => new UserBirthday("19900001")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("月が13の場合にエラーになること", () => {
    expect(() => new UserBirthday("19901301")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("日が00の場合にエラーになること", () => {
    expect(() => new UserBirthday("19900100")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("日が32の場合にエラーになること", () => {
    expect(() => new UserBirthday("19900132")).toThrow("日付形式が不正です（yyyyMMdd）");
  });

  it("アルファベットが含まれる場合にエラーになること", () => {
    expect(() => new UserBirthday("1990010a")).toThrow("日付形式が不正です（yyyyMMdd）");
  });
});
