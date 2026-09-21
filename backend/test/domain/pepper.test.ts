import { describe, it, expect } from "vitest";
import { Pepper } from "../../src/domain/auth";

describe("Pepper", () => {
  it("正常な値でインスタンスを生成できること", () => {
    const pepper = new Pepper("secret-pepper-value");
    expect(pepper.value).toBe("secret-pepper-value");
  });

  it("空文字でエラーになること", () => {
    expect(() => new Pepper("")).toThrow("PEPPERが設定されていません。");
  });

  it("長い値でも生成できること", () => {
    const longValue = "a".repeat(100);
    const pepper = new Pepper(longValue);
    expect(pepper.value).toBe(longValue);
  });
});
