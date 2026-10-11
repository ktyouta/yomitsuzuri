import { describe, it, expect } from "vitest";
import { UserBirthday } from "../../..";

describe("UserBirthday", () => {
  describe("create", () => {
    it.each(["19900101", "20001231", "20000229"])("%s で生成できること", (birthday) => {
      expect(UserBirthday.create(birthday)._unsafeUnwrap().value).toBe(birthday);
    });

    it.each(["19990229", "20000431"])("実在しない日付（%s）の場合、USER_BIRTHDAY_NOT_EXIST を返すこと", (birthday) => {
      expect(UserBirthday.create(birthday)._unsafeUnwrapErr()).toEqual({ type: "USER_BIRTHDAY_NOT_EXIST" });
    });

    it.each(["1990-01-01", "1990/01/01", "1990101", "19900001", "19901301", "19900100", "19900132", "1990010a", ""])(
      "yyyyMMdd 形式でない場合（%s）、USER_BIRTHDAY_INVALID_FORMAT を返すこと",
      (birthday) => {
        expect(UserBirthday.create(birthday)._unsafeUnwrapErr()).toEqual({ type: "USER_BIRTHDAY_INVALID_FORMAT" });
      },
    );
  });
});
