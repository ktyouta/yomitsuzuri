import { describe, it, expect } from "vitest";
import { UserPassword, UserSalt, Pepper } from "../../src/domain";

describe("UserPassword", () => {
  const testPepper = new Pepper("test-pepper-secret");

  it("パスワードをハッシュ化できること", async () => {
    const salt = UserSalt.generate();
    const password = await UserPassword.hash("password123", salt, testPepper);

    expect(password.value).toBeDefined();
    expect(typeof password.value).toBe("string");
  });

  it("ハッシュが128文字（64バイトの16進数）であること", async () => {
    const salt = UserSalt.generate();
    const password = await UserPassword.hash("password123", salt, testPepper);

    expect(password.value).toHaveLength(128);
  });

  it("ハッシュが16進数のみで構成されていること", async () => {
    const salt = UserSalt.generate();
    const password = await UserPassword.hash("password123", salt, testPepper);

    expect(password.value).toMatch(/^[0-9a-f]+$/);
  });

  it("同じパスワード・ソルト・ペッパーで同じハッシュが生成されること", async () => {
    const salt = UserSalt.of("fixed-salt-value-1234567890ab");
    const password1 = await UserPassword.hash("password123", salt, testPepper);
    const password2 = await UserPassword.hash("password123", salt, testPepper);

    expect(password1.value).toBe(password2.value);
  });

  it("異なるパスワードで異なるハッシュが生成されること", async () => {
    const salt = UserSalt.generate();
    const password1 = await UserPassword.hash("password123", salt, testPepper);
    const password2 = await UserPassword.hash("password456", salt, testPepper);

    expect(password1.value).not.toBe(password2.value);
  });

  it("異なるソルトで異なるハッシュが生成されること", async () => {
    const salt1 = UserSalt.generate();
    const salt2 = UserSalt.generate();
    const password1 = await UserPassword.hash("password123", salt1, testPepper);
    const password2 = await UserPassword.hash("password123", salt2, testPepper);

    expect(password1.value).not.toBe(password2.value);
  });

  it("異なるペッパーで異なるハッシュが生成されること", async () => {
    const salt = UserSalt.generate();
    const pepper1 = new Pepper("pepper-1");
    const pepper2 = new Pepper("pepper-2");
    const password1 = await UserPassword.hash("password123", salt, pepper1);
    const password2 = await UserPassword.hash("password123", salt, pepper2);

    expect(password1.value).not.toBe(password2.value);
  });

  it("ofで既存のハッシュ値からインスタンスを生成できること", () => {
    const hashValue = "a".repeat(128);
    const password = UserPassword.of(hashValue);
    expect(password.value).toBe(hashValue);
  });

  it("equalsで同じハッシュを比較できること", async () => {
    const salt = UserSalt.of("fixed-salt-value-1234567890ab");
    const password1 = await UserPassword.hash("password123", salt, testPepper);
    const password2 = await UserPassword.hash("password123", salt, testPepper);

    expect(password1.equals(password2)).toBe(true);
  });

  it("equalsで異なるハッシュを比較できること", async () => {
    const salt = UserSalt.generate();
    const password1 = await UserPassword.hash("password123", salt, testPepper);
    const password2 = await UserPassword.hash("password456", salt, testPepper);

    expect(password1.equals(password2)).toBe(false);
  });
});
