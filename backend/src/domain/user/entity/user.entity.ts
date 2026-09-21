import { UserId, UserName, UserBirthday } from "../value-object";

/**
 * ユーザーエンティティ
 */
export class UserEntity {
  private readonly _userId: UserId;
  private readonly _userName: UserName;
  private readonly _userBirthday: UserBirthday;

  constructor(userId: UserId, userName: UserName, userBirthday: UserBirthday) {
    this._userId = userId;
    this._userName = userName;
    this._userBirthday = userBirthday;
  }

  get userId(): string {
    return this._userId.value;
  }

  get userName(): string {
    return this._userName.value;
  }

  get userBirthday(): string {
    return this._userBirthday.value;
  }
}
