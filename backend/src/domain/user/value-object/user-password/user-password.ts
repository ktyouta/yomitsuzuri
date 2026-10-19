import { UserSalt } from "../user-salt";
import { Pepper } from "../pepper";

/**
 * ユーザーパスワード
 * HMAC-SHA256 + PBKDF2でハッシュ化
 */
export class UserPassword {
  private readonly _value: string;
  private static readonly HASH_LENGTH = 64;
  private static readonly ITERATIONS = 100000;

  private constructor(hashedPassword: string) {
    this._value = hashedPassword;
  }

  get value(): string {
    return this._value;
  }

  /**
   * パスワードをハッシュ化（HMAC-SHA256 + PBKDF2）
   * @param inputPassword 入力パスワード
   * @param salt ソルト
   * @param pepper ペッパー
   */
  static async hash(
    inputPassword: string,
    salt: UserSalt,
    pepper: Pepper
  ): Promise<UserPassword> {
    const encoder = new TextEncoder();
    const pepperKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pepper.value),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const keyedPassword = await crypto.subtle.sign(
      "HMAC",
      pepperKey,
      encoder.encode(inputPassword)
    );

    const baseKey = await crypto.subtle.importKey(
      "raw",
      keyedPassword,
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt.value),
        iterations: UserPassword.ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      UserPassword.HASH_LENGTH * 8
    );

    const hashedPassword = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return new UserPassword(hashedPassword);
  }

  /**
   * ハッシュ済みパスワードからインスタンスを生成
   * @param hashedPassword ハッシュ済みパスワード
   */
  static of(hashedPassword: string): UserPassword {
    return new UserPassword(hashedPassword);
  }

  /**
   * パスワードの一致チェック（タイミング攻撃対策済み）
   * @param other 比較対象
   */
  equals(other: UserPassword): boolean {
    const encoder = new TextEncoder();
    const encodedThis = encoder.encode(this._value);
    const encodedOther = encoder.encode(other.value);

    if (encodedThis.length !== encodedOther.length) {
      return false;
    }

    return crypto.subtle.timingSafeEqual(encodedThis, encodedOther);
  }
}
