import type { AccessToken } from "../../../domain/auth";
import type { UserProfile } from "../../../domain/user";

export type VerifyResultType = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

/**
 * 認証チェック結果 DTO
 */
export class VerifyResultDto {
  private readonly _value: VerifyResultType;

  /**
   * @param accessToken 発行したアクセストークン
   * @param userInfo 認証済みユーザーのプロフィール
   */
  constructor(accessToken: AccessToken, userInfo: UserProfile) {
    this._value = {
      accessToken: accessToken.token,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        birthday: userInfo.birthday,
        darkMode: userInfo.darkMode,
      },
    };
  }

  get value(): VerifyResultType {
    return this._value;
  }
}
