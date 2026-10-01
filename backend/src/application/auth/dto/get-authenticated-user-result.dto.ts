import type { UserProfile } from "../../../domain/user";

export type GetAuthenticatedUserResultType = {
  id: string;
  name: string;
  birthday: string;
  darkMode: boolean;
};

/**
 * 認証済みユーザー取得結果 DTO
 */
export class GetAuthenticatedUserResultDto {
  private readonly _value: GetAuthenticatedUserResultType;

  /**
   * @param userInfo 認証済みユーザーのプロフィール
   */
  constructor(userInfo: UserProfile) {
    this._value = {
      id: userInfo.id,
      name: userInfo.name,
      birthday: userInfo.birthday,
      darkMode: userInfo.darkMode,
    };
  }

  get value(): GetAuthenticatedUserResultType {
    return this._value;
  }
}
