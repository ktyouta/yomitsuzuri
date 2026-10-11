import { describe, it, expect } from "vitest";
import { RawPassword } from "../../..";

describe("RawPassword", () => {
  describe("create", () => {
    it.each(["a", "password123", "パスワード"])("空でなければ（%s）、そのまま保持すること（パスワードの方針は判定しない）", (password) => {
      expect(RawPassword.create(password)._unsafeUnwrap().value).toBe(password);
    });

    it("空の場合、RAW_PASSWORD_EMPTY を返すこと", () => {
      expect(RawPassword.create("")._unsafeUnwrapErr()).toEqual({ type: "RAW_PASSWORD_EMPTY" });
    });
  });
});
