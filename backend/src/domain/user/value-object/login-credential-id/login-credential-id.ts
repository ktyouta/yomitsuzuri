import { ulid } from "ulid";

/**
 * ログイン情報ID（ULID。ログイン情報のレコード自身のID）
 */
export class LoginCredentialId {
  private readonly _value: string;

  private constructor(loginCredentialId: string) {
    if (!loginCredentialId) {
      throw new Error("ログイン情報IDが設定されていません。");
    }
    this._value = loginCredentialId;
  }

  get value(): string {
    return this._value;
  }

  /**
   * ULIDでログイン情報IDを生成
   */
  static create(): LoginCredentialId {
    return new LoginCredentialId(ulid());
  }

  /**
   * 既存のログイン情報IDからインスタンスを生成
   * @param loginCredentialId ログイン情報ID
   */
  static of(loginCredentialId: string): LoginCredentialId {
    return new LoginCredentialId(loginCredentialId);
  }
}
