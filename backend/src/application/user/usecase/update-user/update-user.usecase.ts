import { err, ok, Result } from "neverthrow";
import type { EnvConfig } from "../../../../config";
import { RefreshToken } from "../../../../domain/auth";
import { UserBirthday, type UserBirthdayError } from "../../../../domain/user";
import { UserName, type UserNameError } from "../../../../domain/shared";
import type { UserId } from "../../../../domain/shared";
import type { IUpdateUserRepository } from "../../../../domain/user";
import { UpdateUserResultDto } from "../../dto";

/**
 * ユーザー更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdateUserInputError =
  | { field: "name"; error: UserNameError }
  | { field: "birthday"; error: UserBirthdayError };

export type UpdateUserError =
  | { type: "INVALID_INPUT"; errors: UpdateUserInputError[] }
  | { type: "DUPLICATE_NAME" }
  | { type: "NOT_FOUND" };

/**
 * ユーザー更新ユースケース
 */
export class UpdateUserUsecase {
  constructor(
    private readonly repository: IUpdateUserRepository,
    private readonly config: EnvConfig
  ) { }

  /**
   * ユーザー情報を更新する
   * @param userId 更新対象のユーザーID
   * @param name ユーザー名
   * @param birthday 生年月日（yyyyMMdd）
   * @returns 成功時は更新後のユーザーとリフレッシュトークンの DTO。
   * 入力値が制約を満たさない（違反はすべて返し、DB は問い合わせない）・ユーザー名が重複している・ユーザーが存在しない場合はエラー
   */
  async execute(userId: UserId, name: string, birthday: string): Promise<Result<UpdateUserResultDto, UpdateUserError>> {
    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      UserName.create(name).mapErr((error): UpdateUserInputError => ({ field: "name", error })),
      UserBirthday.create(birthday).mapErr((error): UpdateUserInputError => ({ field: "birthday", error })),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [userName, userBirthday] = input.value;

    // ユーザー名の重複チェック
    if (await this.repository.checkUserNameExists(userId, userName)) {
      return err({ type: "DUPLICATE_NAME" });
    }

    const updateResult = await this.repository.updateUserWithLogin(userId, userName, userBirthday);
    if (!updateResult) {
      return err({ type: "NOT_FOUND" });
    }

    const refreshToken = await RefreshToken.create(userId, this.config);

    return ok(new UpdateUserResultDto(updateResult.entity, updateResult.darkMode, refreshToken));
  }
}
