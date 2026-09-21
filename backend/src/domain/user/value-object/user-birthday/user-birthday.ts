/**
 * ユーザー生年月日
 */
export class UserBirthday {
  private readonly _value: string;

  constructor(userBirthday: string) {
    if (!this.checkFormat(userBirthday)) {
      throw new Error("日付形式が不正です（yyyyMMdd）");
    }
    if (!this.checkDateValid(userBirthday)) {
      throw new Error("生年月日が正しくありません");
    }
    this._value = userBirthday;
  }

  get value(): string {
    return this._value;
  }

  private checkFormat(userBirthday: string): boolean {
    const regex = /^[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;
    return regex.test(userBirthday);
  }

  private checkDateValid(userBirthday: string): boolean {
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
