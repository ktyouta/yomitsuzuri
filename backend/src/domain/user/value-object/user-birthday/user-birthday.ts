import { err, ok, type Result } from "neverthrow";

/**
 * ユーザー生年月日の生成失敗
 */
export type UserBirthdayError = { type: "USER_BIRTHDAY_INVALID_FORMAT" }
  | { type: "USER_BIRTHDAY_NOT_EXIST" };

/**
 * ユーザー生年月日
 */
export class UserBirthday {
  private readonly _value: string;

  /**
   * @param userBirthday yyyyMMdd 形式で実在する日付
   */
  private constructor(userBirthday: string) {
    this._value = userBirthday;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する
   * @param userBirthday 生年月日（yyyyMMdd）
   * @returns 成功時は生年月日、形式不正・実在しない日付の場合はその内容を持つ Result
   */
  static create(userBirthday: string): Result<UserBirthday, UserBirthdayError> {
    if (!UserBirthday.checkFormat(userBirthday)) {
      return err({ type: "USER_BIRTHDAY_INVALID_FORMAT" });
    }

    if (!UserBirthday.checkDateValid(userBirthday)) {
      return err({ type: "USER_BIRTHDAY_NOT_EXIST" });
    }

    return ok(new UserBirthday(userBirthday));
  }

  /**
   * yyyyMMdd 形式か判定する（月は 01〜12、日は 01〜31 の範囲のみ。実在するかは判定しない）
   * @param userBirthday 生年月日
   * @returns 形式を満たす場合は true
   */
  private static checkFormat(userBirthday: string): boolean {
    const regex = /^[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;
    return regex.test(userBirthday);
  }

  /**
   * 実在する日付か判定する（形式を満たすことが前提）
   * @param userBirthday yyyyMMdd 形式の生年月日
   * @returns 実在する日付の場合は true
   */
  private static checkDateValid(userBirthday: string): boolean {
    const year = parseInt(userBirthday.substring(0, 4), 10);
    const month = parseInt(userBirthday.substring(4, 6), 10) - 1;
    const day = parseInt(userBirthday.substring(6, 8), 10);

    const date = new Date(year, month, day);
    return (
      year === date.getFullYear() &&
      month === date.getMonth() &&
      day === date.getDate()
    );
  }
}
