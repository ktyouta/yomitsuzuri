import { err, ok, type Result } from "neverthrow";

/**
 * 新しく設定するパスワードの生成失敗
 */
export type NewPasswordError = { type: "NEW_PASSWORD_TOO_SHORT"; min: number }
  | { type: "NEW_PASSWORD_INVALID_CHARACTER" };

/**
 * 新しく設定するパスワード（ハッシュ化前の平文。ハッシュ済みの値は UserPassword が表す）
 */
export class NewPassword {
  static readonly MIN_LENGTH = 8;

  /**
   * 半角英数記号（ASCII の印字可能文字。空白を除く）
   */
  private static readonly ALLOWED_PATTERN = /^[\x21-\x7E]+$/;
  private readonly _value: string;

  /**
   * @param newPassword パスワードの方針を満たす平文のパスワード
   */
  private constructor(newPassword: string) {
    this._value = newPassword;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する
   * @param newPassword 平文のパスワード
   * @returns 成功時は新しいパスワード、文字数不足・使えない文字を含む場合はその内容を持つ Result
   */
  static create(newPassword: string): Result<NewPassword, NewPasswordError> {
    if (newPassword.length < NewPassword.MIN_LENGTH) {
      return err({ type: "NEW_PASSWORD_TOO_SHORT", min: NewPassword.MIN_LENGTH });
    }

    if (!NewPassword.ALLOWED_PATTERN.test(newPassword)) {
      return err({ type: "NEW_PASSWORD_INVALID_CHARACTER" });
    }

    return ok(new NewPassword(newPassword));
  }
}
