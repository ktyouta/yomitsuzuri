import type { LoginNameError, NewPasswordError, RawPasswordError } from "../../../../domain";

/**
 * 認証コンテキストの入力値の違反（値オブジェクトの制約違反、確認用パスワードの不一致）
 */
type AuthInputError =
  | LoginNameError
  | RawPasswordError
  | NewPasswordError
  | { type: "PASSWORD_CONFIRMATION_MISMATCH" };

/**
 * 入力値の違反を、利用者向けのメッセージに変換する
 * @param error 入力値の違反
 * @returns 利用者向けのメッセージ
 */
export function toInputErrorMessage(error: AuthInputError): string {
  switch (error.type) {
    case "LOGIN_NAME_EMPTY":
      return "ユーザー名を入力してください";
    case "RAW_PASSWORD_EMPTY":
      return "パスワードを入力してください";
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
