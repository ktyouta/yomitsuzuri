import { err, ok, Result } from "neverthrow";
import type { EnvConfig } from "../../../../config";
import { AccessToken, NewPassword, Pepper, RefreshToken, UserAggregate, UserBirthday, UserName, type NewPasswordError, type UserBirthdayError, type UserNameError } from "../../../../domain/user";
import type { ICreateUserRepository, UserNameUniquenessDomainService } from "../../../../domain/user";
import { CreateUserResultDto } from "../../dto";

/**
 * ユーザー作成の入力値の制約違反（field は入力値の項目名）
 */
export type CreateUserInputError =
  | { field: "name"; error: UserNameError }
  | { field: "birthday"; error: UserBirthdayError }
  | { field: "password"; error: NewPasswordError }
  | { field: "confirmPassword"; error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } };

export type CreateUserError =
  | { type: "INVALID_INPUT"; errors: CreateUserInputError[] }
  | { type: "DUPLICATE_NAME" };

type CreateUserBody = {
  name: string;
  birthday: string;
  password: string;
  confirmPassword: string;
};

type PropsType = {
  body: CreateUserBody;
}

/**
 * ユーザー作成ユースケース
 */
export class CreateUserUsecase {
  constructor(
    private readonly repository: ICreateUserRepository,
    private readonly config: EnvConfig,
    private readonly uniquenessService: UserNameUniquenessDomainService,
  ) { }

  /**
   * ユーザーを新規作成する
   * @param body ユーザーの登録内容
   * @returns 成功時は作成したユーザーとトークンの DTO。
   * 入力値が制約を満たさない（確認用パスワードの不一致を含む。違反はすべて返し、DB は問い合わせない）・ユーザー名が重複している場合はエラー（いずれも保存しない）
   */
  async execute({ body }: PropsType): Promise<Result<CreateUserResultDto, CreateUserError>> {
    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      UserName.create(body.name).mapErr((error): CreateUserInputError => ({ field: "name", error })),
      UserBirthday.create(body.birthday).mapErr((error): CreateUserInputError => ({ field: "birthday", error })),
      NewPassword.create(body.password).mapErr((error): CreateUserInputError => ({ field: "password", error })),
      body.password === body.confirmPassword
        ? ok(undefined)
        : err<undefined, CreateUserInputError>({ field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } }),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [userName, userBirthday, newPassword] = input.value;

    const user = await UserAggregate.generate({
      name: userName,
      birthday: userBirthday,
      password: newPassword,
      pepper: new Pepper(this.config.pepper),
    });

    // ユーザー名の重複チェック（userId は未使用の新規 ID のため自己除外は実質的に無効）
    if (await this.uniquenessService.isDuplicated(user.id, userName)) {
      return err({ type: "DUPLICATE_NAME" });
    }

    // ユーザー情報作成
    await this.repository.createUser(user);

    const accessToken = await AccessToken.create(user.id, this.config);
    const refreshToken = await RefreshToken.create(user.id, this.config);

    return ok(new CreateUserResultDto(user, accessToken, refreshToken));
  }
}
