import type { AccessToken, RefreshToken } from "../../../domain/auth";
import type { UserProfile } from "../../../domain/user";

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
   * @param userInfo ログインユーザーのプロフィール
   * @param accessToken 発行したアクセストークン
   * @param refreshToken 発行したリフレッシュトークン
   */
  constructor(userInfo: UserProfile, accessToken: AccessToken, refreshToken: RefreshToken) {
    this._value = {
      accessToken: accessToken.token,
      refreshToken: refreshToken.value,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        birthday: userInfo.birthday,
        darkMode: userInfo.darkMode,
      },
    };
  }

  get value(): LoginResultType {
    return this._value;
  }
}
