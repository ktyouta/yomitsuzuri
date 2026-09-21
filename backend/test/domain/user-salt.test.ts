import { describe, it, expect } from "vitest";
import { UserSalt } from "../../src/domain";

describe("UserSalt", () => {
  it("generateでランダムなソルトを生成できること", () => {
    const salt = UserSalt.generate();
    expect(salt.value).toBeDefined();
    expect(typeof salt.value).toBe("string");
  });

  it("生成されるソルトが32文字（16バイトの16進数）であること", () => {
    const salt = UserSalt.generate();
    expect(salt.value).toHaveLength(32);
  });

  it("生成されるソルトが16進数のみで構成されていること", () => {
    const salt = UserSalt.generate();
    expect(salt.value).toMatch(/^[0-9a-f]+$/);
  });

  it("毎回異なるソルトが生成されること", () => {
    const salt1 = UserSalt.generate();
    const salt2 = UserSalt.generate();
    expect(salt1.value).not.toBe(salt2.value);
  });

  it("ofで既存のソルト値からインスタンスを生成できること", () => {
    const saltValue = "abcdef0123456789abcdef0123456789";
    const salt = UserSalt.of(saltValue);
    expect(salt.value).toBe(saltValue);
  });
});
