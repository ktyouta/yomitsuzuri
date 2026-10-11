import type { NewPasswordError, UserBirthdayError, UserNameError } from "../../../../domain";

/**
 * ユーザーコンテキストの入力値の違反（値オブジェクトの制約違反、確認用パスワードの不一致）
 */
type UserInputError =
  | UserNameError
  | UserBirthdayError
  | NewPasswordError
  | { type: "PASSWORD_CONFIRMATION_MISMATCH" };

/**
 * 入力値の違反を、利用者向けのメッセージに変換する
 * @param error 入力値の違反
 * @returns 利用者向けのメッセージ
 */
export function toInputErrorMessage(error: UserInputError): string {
  switch (error.type) {
    case "USER_NAME_TOO_SHORT":
      return `ユーザー名は${error.min}文字以上で入力してください`;
    case "USER_NAME_TOO_LONG":
      return `ユーザー名は${error.max}文字以内で入力してください`;
    case "USER_BIRTHDAY_INVALID_FORMAT":
      return "生年月日は日付形式(yyyyMMdd)で入力してください";
    case "USER_BIRTHDAY_NOT_EXIST":
      return "生年月日は実在する日付を入力してください";
    case "NEW_PASSWORD_TOO_SHORT":
      return `パスワードは${error.min}文字以上で入力してください`;
    case "NEW_PASSWORD_INVALID_CHARACTER":
      return "パスワードは半角英数記号で入力してください";
    case "PASSWORD_CONFIRMATION_MISMATCH":
      return "確認用パスワードが一致しません。";
    default: {
      // 全てのエラー種別を網羅していることを型で保証する
      error satisfies never;
      return "入力内容が不正です";
    }
  }
}
