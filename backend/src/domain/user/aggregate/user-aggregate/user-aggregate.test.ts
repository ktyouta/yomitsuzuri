import { describe, it, expect } from "vitest";
import { UserAggregate } from "..";
import { LoginCredentialId, LoginId, NewPassword, Pepper, RawPassword, UserBirthday, UserName, UserPassword, UserSalt } from "../../value-object";
import { UserId } from "../../../shared";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const LOGIN_CREDENTIAL_ID = "01BX5ZZKBKACTAV9WEVGEMMVRZ";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const PEPPER = new Pepper("test-pepper");

function rawPassword(value: string): RawPassword {
  return RawPassword.create(value)._unsafeUnwrap();
}

function newPassword(value: string): NewPassword {
  return NewPassword.create(value)._unsafeUnwrap();
}

/**
 * 永続化済みのユーザー集約を復元する（パスワードは "password123"）
 */
async function reconstructUser(deleteFlg = false): Promise<UserAggregate> {
  const salt = UserSalt.of("0123456789abcdef0123456789abcdef");
  return UserAggregate.reconstruct({
    id: UserId.of(USER_ID),
    name: UserName.of("testuser"),
    birthday: UserBirthday.of("19900101"),
    darkMode: false,
    loginCredentialId: LoginCredentialId.of(LOGIN_CREDENTIAL_ID),
    loginId: LoginId.of("testuser"),
    password: await UserPassword.hash("password123", salt, PEPPER),
    salt,
    deleteFlg,
  });
}

describe("UserAggregate", () => {
  describe("create", () => {
    it("渡した値と初期値（ダークモード無効・ログイン ID はユーザー名・未削除）を持ち、ID とソルトを採番すること", async () => {
      const user = await UserAggregate.create({
        name: UserName.of("testuser"),
        birthday: UserBirthday.of("19900101"),
        password: newPassword("password123"),
        pepper: PEPPER,
      });

      expect(user.toSnapshot()).toEqual({
        id: expect.stringMatching(ULID_PATTERN),
        name: "testuser",
        birthday: "19900101",
        darkMode: false,
        loginCredentialId: expect.stringMatching(ULID_PATTERN),
        loginId: "testuser",
        passwordHash: expect.any(String),
        salt: expect.stringMatching(/^[0-9a-f]{32}$/),
        deleteFlg: false,
      });
    });

    it("パスワードをハッシュ化して保持し、同じパスワードで照合できること", async () => {
      const user = await UserAggregate.create({
        name: UserName.of("testuser"),
        birthday: UserBirthday.of("19900101"),
        password: newPassword("password123"),
        pepper: PEPPER,
      });

      expect(user.toSnapshot().passwordHash).not.toBe("password123");
      expect(await user.verifyPassword(rawPassword("password123"), PEPPER)).toBe(true);
    });
  });

  describe("reconstruct", () => {
    it("渡した値をそのまま保持すること", async () => {
      const salt = UserSalt.of("0123456789abcdef0123456789abcdef");
      const user = UserAggregate.reconstruct({
        id: UserId.of(USER_ID),
        name: UserName.of("testuser"),
        birthday: UserBirthday.of("19900101"),
        darkMode: true,
        loginCredentialId: LoginCredentialId.of(LOGIN_CREDENTIAL_ID),
        loginId: LoginId.of("testuser"),
        password: UserPassword.of("hashed"),
        salt,
        deleteFlg: true,
      });

      expect(user.toSnapshot()).toEqual({
        id: USER_ID,
        name: "testuser",
        birthday: "19900101",
        darkMode: true,
        loginCredentialId: LOGIN_CREDENTIAL_ID,
        loginId: "testuser",
        passwordHash: "hashed",
        salt: "0123456789abcdef0123456789abcdef",
        deleteFlg: true,
      });
    });
  });

  describe("updateUser", () => {
    it("ユーザー名・生年月日を置き換え、ログイン ID をユーザー名にそろえること（他の値は変更しない）", async () => {
      const user = await reconstructUser();
      const before = user.toSnapshot();

      user.updateUser({ name: UserName.of("newname"), birthday: UserBirthday.of("20000229") });

      expect(user.toSnapshot()).toEqual({ ...before, name: "newname", birthday: "20000229", loginId: "newname" });
    });

    it("削除済みの場合、throw すること", async () => {
      const user = await reconstructUser(true);

      expect(() => user.updateUser({ name: UserName.of("newname"), birthday: UserBirthday.of("20000229") })).toThrow();
    });
  });

  describe("updateDarkMode", () => {
    it("ダークモード設定を置き換えること（他の値は変更しない）", async () => {
      const user = await reconstructUser();
      const before = user.toSnapshot();

      user.updateDarkMode(true);

      expect(user.toSnapshot()).toEqual({ ...before, darkMode: true });
    });

    it("削除済みの場合、throw すること", async () => {
      const user = await reconstructUser(true);

      expect(() => user.updateDarkMode(true)).toThrow();
    });
  });

  describe("verifyPassword", () => {
    it("登録済みのパスワードと一致する場合、true を返すこと", async () => {
      const user = await reconstructUser();

      expect(await user.verifyPassword(rawPassword("password123"), PEPPER)).toBe(true);
    });

    it("登録済みのパスワードと一致しない場合、false を返すこと", async () => {
      const user = await reconstructUser();

      expect(await user.verifyPassword(rawPassword("wrong-password"), PEPPER)).toBe(false);
    });

    it("自身を変更しないこと", async () => {
      const user = await reconstructUser();
      const before = user.toSnapshot();

      await user.verifyPassword(rawPassword("password123"), PEPPER);

      expect(user.toSnapshot()).toEqual(before);
    });

    it("削除済みの場合、throw すること", async () => {
      const user = await reconstructUser(true);

      await expect(user.verifyPassword(rawPassword("password123"), PEPPER)).rejects.toThrow();
    });
  });

  describe("changePassword", () => {
    it("現在のパスワードが一致する場合、ok を返し、同じソルトでハッシュ化した新しいパスワードに置き換えること", async () => {
      const user = await reconstructUser();
      const before = user.toSnapshot();

      const result = await user.changePassword(rawPassword("password123"), newPassword("newpassword456"), PEPPER);

      expect(result.isOk()).toBe(true);
      const expected = await UserPassword.hash("newpassword456", UserSalt.of(before.salt), PEPPER);
      expect(user.toSnapshot()).toEqual({ ...before, passwordHash: expected.value });
      expect(await user.verifyPassword(rawPassword("newpassword456"), PEPPER)).toBe(true);
    });

    it("現在のパスワードが一致しない場合、CURRENT_PASSWORD_MISMATCH を返し、自身を変更しないこと", async () => {
      const user = await reconstructUser();
      const before = user.toSnapshot();

      const result = await user.changePassword(rawPassword("wrong-password"), newPassword("newpassword456"), PEPPER);

      expect(result._unsafeUnwrapErr()).toEqual({ type: "CURRENT_PASSWORD_MISMATCH" });
      expect(user.toSnapshot()).toEqual(before);
    });

    it("削除済みの場合、throw すること", async () => {
      const user = await reconstructUser(true);

      await expect(user.changePassword(rawPassword("password123"), newPassword("newpassword456"), PEPPER)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("削除済みにすること（他の値は変更しない）", async () => {
      const user = await reconstructUser();
      const before = user.toSnapshot();

      user.delete();

      expect(user.toSnapshot()).toEqual({ ...before, deleteFlg: true });
    });

    it("既に削除済みの場合、throw すること", async () => {
      const user = await reconstructUser(true);

      expect(() => user.delete()).toThrow();
    });
  });
});
