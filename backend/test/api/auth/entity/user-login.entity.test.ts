import { describe, it, expect } from "vitest";
import {
  UserLoginEntity,
  UserId,
  UserName,
  UserSalt,
  UserPassword,
  Pepper,
} from "../../../../src/domain";

describe("UserLoginEntity", () => {
  const pepper = new Pepper("test-pepper");

  it("エンティティを生成できること", async () => {
    const loginId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const userId = UserId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
    const loginName = new UserName("testuser");
    const salt = UserSalt.generate();
    const password = await UserPassword.hash("password123", salt, pepper);

    const entity = new UserLoginEntity(loginId, userId, loginName, password, salt);

    expect(entity.loginId).toBe(loginId.value);
    expect(entity.userId).toBe(userId.value);
    expect(entity.loginName).toBe("testuser");
    expect(entity.passwordHash).toBe(password.value);
    expect(entity.salt).toBe(salt.value);
  });

  it("verifyPasswordで正しいパスワードを検証できること", async () => {
    const salt = UserSalt.generate();
    const password = await UserPassword.hash("password123", salt, pepper);
    const entity = new UserLoginEntity(
      UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
      UserId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
      new UserName("testuser"),
      password,
      salt
    );

    expect(await entity.verifyPassword("password123", pepper)).toBe(true);
  });

  it("verifyPasswordで誤ったパスワードを拒否すること", async () => {
    const salt = UserSalt.generate();
    const password = await UserPassword.hash("password123", salt, pepper);
    const entity = new UserLoginEntity(
      UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
      UserId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
      new UserName("testuser"),
      password,
      salt
    );

    expect(await entity.verifyPassword("wrong-password", pepper)).toBe(false);
  });
});
