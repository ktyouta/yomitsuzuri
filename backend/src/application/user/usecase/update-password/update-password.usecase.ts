import { err, ok, Result } from "neverthrow";
import type { EnvConfig } from "../../../../config";
import { NewPassword, Pepper, RawPassword, type NewPasswordError, type RawPasswordError } from "../../../../domain/user";
import type { IUpdatePasswordRepository } from "../../../../domain/user";
import type { UserId } from "../../../../domain/shared";

/**
 * パスワード更新の入力値の制約違反（field は入力値の項目名）
 */
export type UpdatePasswordInputError =
  | { field: "nowPassword"; error: RawPasswordError }
  | { field: "newPassword"; error: NewPasswordError }
  | { field: "confirmPassword"; error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } };

export type UpdatePasswordError =
  | { type: "INVALID_INPUT"; errors: UpdatePasswordInputError[] }
  | { type: "CURRENT_PASSWORD_MISMATCH" }
  | { type: "NOT_FOUND" };

type UpdatePasswordBody = {
  nowPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PropsType = {
  userId: UserId;
  body: UpdatePasswordBody;
}

/**
 * パスワード更新ユースケース
 */
export class UpdatePasswordUsecase {
  constructor(
    private readonly repository: IUpdatePasswordRepository,
    private readonly config: EnvConfig
  ) { }

  /**
   * パスワードを更新する
   * @param userId 更新対象のユーザーID
   * @param body 現在のパスワード・新しいパスワード・確認用パスワード
   * @returns 成功時は ok（新しいパスワードで更新する）。
   * 入力値が制約を満たさない（確認用パスワードの不一致を含む。違反はすべて返し、DB は問い合わせない）場合は INVALID_INPUT、
   * ユーザー・更新対象がない場合は NOT_FOUND、現在のパスワードが一致しない場合は CURRENT_PASSWORD_MISMATCH（いずれも更新しない）
   */
  async execute({ userId, body }: PropsType): Promise<Result<void, UpdatePasswordError>> {
    // 入力値の制約チェック
    const input = Result.combineWithAllErrors([
      RawPassword.create(body.nowPassword).mapErr((error): UpdatePasswordInputError => ({ field: "nowPassword", error })),
      NewPassword.create(body.newPassword).mapErr((error): UpdatePasswordInputError => ({ field: "newPassword", error })),
      body.newPassword === body.confirmPassword
        ? ok(undefined)
        : err<undefined, UpdatePasswordInputError>({ field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } }),
    ]);
    if (input.isErr()) {
      return err({ type: "INVALID_INPUT", errors: input.error });
    }
    const [nowPassword, newPassword] = input.value;

    const user = await this.repository.findUser(userId);
    if (!user) {
      return err({ type: "NOT_FOUND" });
    }

    // パスワードの変更（現在のパスワードが一致しない場合は changePassword が拒否する）
    const changeResult = await user.changePassword(nowPassword, newPassword, new Pepper(this.config.pepper));
    if (changeResult.isErr()) {
      return err(changeResult.error);
    }

    if (!(await this.repository.updatePassword(user))) {
      return err({ type: "NOT_FOUND" });
    }

    return ok(undefined);
  }
}
