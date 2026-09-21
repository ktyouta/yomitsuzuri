export type UpdateUserResponseType = {
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

export class UpdateUserResponseDto {
  private readonly _value: UpdateUserResponseType;

  constructor(userId: string, userName: string, birthday: string, darkMode: boolean) {
    this._value = {
      user: {
        id: userId,
        name: userName,
        birthday,
        darkMode,
      },
    };
  }

  get value(): UpdateUserResponseType {
    return this._value;
  }
}
