import type { AccessToken, RefreshToken, UserAggregate } from "../../../../domain/user";

export type CreateUserResultType = {
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
 * ユーザー作成結果 DTO
 */
export class CreateUserResultDto {
  private readonly _value: CreateUserResultType;

  /**
   * @param user 作成したユーザー
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

  get value(): CreateUserResultType {
    return this._value;
  }
}
