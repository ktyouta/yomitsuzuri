import type { RefreshToken, UserAggregate } from "../../../../domain/user";

export type UpdateUserResultType = {
  refreshToken: string;
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

/**
 * ユーザー更新結果 DTO
 */
export class UpdateUserResultDto {
  private readonly _value: UpdateUserResultType;

  /**
   * @param user 更新後のユーザー
   * @param refreshToken 再発行したリフレッシュトークン
   */
  constructor(user: UserAggregate, refreshToken: RefreshToken) {
    this._value = {
      refreshToken: refreshToken.value,
      user: {
        id: user.id.value,
        name: user.name.value,
        birthday: user.birthday.value,
        darkMode: user.darkMode,
      },
    };
  }

  get value(): UpdateUserResultType {
    return this._value;
  }
}
