import { UserEntity } from "../../../domain/user";

export type CreateUserResponseType = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

export class CreateUserResponseDto {
  private readonly _value: CreateUserResponseType;

  constructor(entity: UserEntity, accessToken: string) {
    this._value = {
      accessToken,
      user: {
        id: entity.userId,
        name: entity.userName,
        birthday: entity.userBirthday,
        // 新規作成直後はDBスキーマの既定値（false）と必ず一致する
        darkMode: false,
      },
    };
  }

  get value(): CreateUserResponseType {
    return this._value;
  }
}
