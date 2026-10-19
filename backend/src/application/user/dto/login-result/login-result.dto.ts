import type { AccessToken, RefreshToken, UserAggregate } from "../../../../domain/user";

export type LoginResultType = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

/**
 * ログイン結果 DTO
 */
export class LoginResultDto {
  private readonly _value: LoginResultType;

  /**
   * @param user ログインユーザー
   * @param accessToken 発行したアクセストークン
   * @param refreshToken 発行したリフレッシュトークン
   */
  constructor(user: UserAggregate, accessToken: AccessToken, refreshToken: RefreshToken) {
    this._value = {
      accessToken: accessToken.token,
      refreshToken: refreshToken.value,
      user: {
        id: user.id.value,
        name: user.name.value,
        birthday: user.birthday.value,
        darkMode: user.darkMode,
      },
    };
  }

  get value(): LoginResultType {
    return this._value;
  }
}
