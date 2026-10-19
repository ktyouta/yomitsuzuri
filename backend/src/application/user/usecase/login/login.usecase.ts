import { err, ok, Result } from "neverthrow";
import type { EnvConfig } from "../../../../config";
import { AccessToken, LoginId, Pepper, RawPassword, RefreshToken, type LoginIdError, type RawPasswordError } from "../../../../domain/user";
import type { IUserLoginRepository } from "../../../../domain/user";
import { LoginResultDto } from "../../dto";

/**
 * ログインの入力値の制約違反（field は入力値の項目名）
 */
export type LoginInputError =
  | { field: "name"; error: LoginIdError }
  | { field: "password"; error: RawPasswordError };

export type LoginError =
  | { type: "INVALID_INPUT"; errors: LoginInputError[] }
  | { type: "AUTHENTICATION_FAILED" };

type PropsType = {
  name: string;
  password: string;
}

/**
 * ログインユースケース
 */
export class LoginUsecase {
  constructor(
    private readonly loginRepository: IUserLoginRepository,
    private readonly config: EnvConfig
  ) { }

  /**
   * ログインする
   * @param name ユーザー名
   * @param password 平文のパスワード
   * @returns 成功時はトークンとプロフィールの DTO（最終ログイン日時を更新する）。
   * 入力値が空の場合は INVALID_INPUT（違反はすべて返し、DB は問い合わせない）。
   * ユーザーが存在しない（ユーザーまたはログイン情報が削除済みを含む）・パスワードが一致しない場合は AUTHENTICATION_FAILED（最終ログイン日時は更新しない）
   */
  async execute({ name, password }: PropsType): Promise<Result<LoginResultDto, LoginError>> {
    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      LoginId.create(name).mapErr((error): LoginInputError => ({ field: "name", error })),
      RawPassword.create(password).mapErr((error): LoginInputError => ({ field: "password", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [loginId, rawPassword] = input.value;

    const user = await this.loginRepository.findUser(loginId);
    if (!user) {
      return err({ type: "AUTHENTICATION_FAILED" });
    }

    const pepper = new Pepper(this.config.pepper);
    const isValid = await user.verifyPassword(rawPassword, pepper);
    if (!isValid) {
      return err({ type: "AUTHENTICATION_FAILED" });
    }

    const accessToken = await AccessToken.create(user.id, this.config);
    const refreshToken = await RefreshToken.create(user.id, this.config);

    await this.loginRepository.updateLastLoginDate(user.id);

    return ok(new LoginResultDto(user, accessToken, refreshToken));
  }
}
