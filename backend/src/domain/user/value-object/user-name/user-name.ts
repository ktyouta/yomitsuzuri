/**
 * ユーザー名
 */
export class UserName {
  private readonly _value: string;

  constructor(userName: string) {
    if (!userName) {
      throw new Error("ユーザー名が設定されていません。");
    }
    this._value = userName;
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserName): boolean {
    return this._value === other.value;
  }
}
