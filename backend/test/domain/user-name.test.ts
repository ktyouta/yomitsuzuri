import { describe, it, expect } from "vitest";
import { UserName } from "../../src/domain";

describe("UserName", () => {
  it("正常な名前でインスタンスを生成できること", () => {
    const userName = new UserName("testuser");
    expect(userName.value).toBe("testuser");
  });

  it("日本語の名前でも生成できること", () => {
    const userName = new UserName("テストユーザー");
    expect(userName.value).toBe("テストユーザー");
  });

  it("空文字でエラーになること", () => {
    expect(() => new UserName("")).toThrow("ユーザー名が設定されていません。");
  });

  it("equalsで同じ値を比較できること", () => {
    const userName1 = new UserName("testuser");
    const userName2 = new UserName("testuser");
    expect(userName1.equals(userName2)).toBe(true);
  });

  it("equalsで異なる値を比較できること", () => {
    const userName1 = new UserName("testuser");
    const userName2 = new UserName("otheruser");
    expect(userName1.equals(userName2)).toBe(false);
  });
});
