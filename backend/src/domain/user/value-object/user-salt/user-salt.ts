/**
 * ユーザーソルト
 */
export class UserSalt {
  private readonly _value: string;

  private constructor(salt: string) {
    this._value = salt;
  }

  get value(): string {
    return this._value;
  }

  /**
   * ランダムなソルトを生成（16バイト = 32文字の16進数）
   */
  static generate(): UserSalt {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const salt = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return new UserSalt(salt);
  }

  /**
   * 既存のソルトからインスタンスを生成
   * @param salt ソルト
   */
  static of(salt: string): UserSalt {
    return new UserSalt(salt);
  }
}
