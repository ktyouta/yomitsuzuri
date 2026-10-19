import { describe, it, expect } from "vitest";
import { NewPassword } from "../../..";

describe("NewPassword", () => {
  describe("create", () => {
    it.each(["password", "Pass!@#$1234", "~".repeat(NewPassword.MIN_LENGTH)])("%s で生成できること", (password) => {
      expect(NewPassword.create(password)._unsafeUnwrap().value).toBe(password);
    });

    it.each(["", "a".repeat(NewPassword.MIN_LENGTH - 1)])("最小文字数未満（%s）の場合、NEW_PASSWORD_TOO_SHORT を最小文字数とともに返すこと", (password) => {
      expect(NewPassword.create(password)._unsafeUnwrapErr()).toEqual({ type: "NEW_PASSWORD_TOO_SHORT", min: NewPassword.MIN_LENGTH });
    });

    it.each(["password 1", "パスワード12345", "password\t1"])("半角英数記号以外を含む場合（%s）、NEW_PASSWORD_INVALID_CHARACTER を返すこと", (password) => {
      expect(NewPassword.create(password)._unsafeUnwrapErr()).toEqual({ type: "NEW_PASSWORD_INVALID_CHARACTER" });
    });
  });
});
