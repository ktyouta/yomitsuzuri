import type { UserId, UserName } from "../../../shared";
import type { NewPassword, Pepper, RawPassword, UserSalt } from "../../value-object";
import { UserPassword } from "../../value-object";

/**
 * ユーザーログインエンティティ
 */
export class UserLoginEntity {
  private readonly _loginId: UserId; // ログインレコード自身のID（ULID）
  private readonly _userId: UserId;  // user_master.id（FK）
  private readonly _loginName: UserName;
  private readonly _passwordHash: UserPassword;
  private readonly _salt: UserSalt;

  constructor(
    loginId: UserId,
    userId: UserId,
    loginName: UserName,
    passwordHash: UserPassword,
    salt: UserSalt
  ) {
    this._loginId = loginId;
    this._userId = userId;
    this._loginName = loginName;
    this._passwordHash = passwordHash;
    this._salt = salt;
  }

  get loginId(): string {
    return this._loginId.value;
  }

  get userId(): string {
    return this._userId.value;
  }

  get loginName(): string {
    return this._loginName.value;
  }

  get passwordHash(): string {
    return this._passwordHash.value;
  }

  get salt(): string {
    return this._salt.value;
  }

  /**
   * 入力パスワードが登録済みパスワードと一致するか検証する
   * @param rawPassword 照合用のパスワード（平文）
   * @param pepper ペッパー
   * @returns 一致する場合は true
   */
  async verifyPassword(rawPassword: RawPassword, pepper: Pepper): Promise<boolean> {
    const hashed = await UserPassword.hash(rawPassword.value, this._salt, pepper);
    return hashed.equals(this._passwordHash);
  }

  /**
   * 登録時と同じソルトで新しいパスワードをハッシュ化する
   * @param newPassword 新しく設定するパスワード
   * @param pepper ペッパー
   * @returns ハッシュ済みのパスワード
   */
  async hashNewPassword(newPassword: NewPassword, pepper: Pepper): Promise<UserPassword> {
    return await UserPassword.hash(newPassword.value, this._salt, pepper);
  }
}
