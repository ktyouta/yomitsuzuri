import type { BookMemoError, BookTitleError, BookValidationError, CurrentPageError, IconIdError, PublishedDateError, ReadingStatusIdError, WorkIdError, WorkMemoError, WorkSortError, WorkTitleError } from "../../../../domain";

/**
 * 書籍コンテキストの入力値の違反（値オブジェクトの制約違反、集約の作品の指定の誤り・不変条件の違反）
 */
type BookInputError =
  | BookTitleError
  | PublishedDateError
  | ReadingStatusIdError
  | CurrentPageError
  | BookMemoError
  | IconIdError
  | WorkIdError
  | WorkTitleError
  | WorkSortError
  | WorkMemoError
  | BookValidationError;

/**
 * 入力値の違反を、利用者向けのメッセージに変換する
 * @param error ドメインが返した入力値の違反
 * @returns 利用者向けのメッセージ
 */
export function toInputErrorMessage(error: BookInputError): string {
  switch (error.type) {
    case "BOOK_TITLE_EMPTY":
      return "タイトルは必須です";
    case "BOOK_TITLE_TOO_LONG":
      return `タイトルは${error.max}文字以内で入力してください`;
    case "PUBLISHED_DATE_INVALID_FORMAT":
      return "出版日はYYYY / YYYY-MM / YYYY-MM-DDの形式で入力してください";
    case "PUBLISHED_DATE_NOT_EXIST":
      return "出版日は実在する日付を入力してください";
    case "READING_STATUS_ID_INVALID":
      return "読書状況が不正です";
    case "CURRENT_PAGE_INVALID":
      return `現在のページ数は${error.min}以上の整数で入力してください`;
    case "BOOK_MEMO_TOO_LONG":
      return `メモは${error.max}文字以内で入力してください`;
    case "ICON_ID_INVALID":
      return "アイコンIDが不正です";
    case "WORK_ID_INVALID":
      return "作品IDの形式が正しくありません";
    case "WORK_TITLE_EMPTY":
      return "作品タイトルは必須です";
    case "WORK_TITLE_TOO_LONG":
      return `作品タイトルは${error.max}文字以内で入力してください`;
    case "WORK_SORT_INVALID":
      return `表示順は${error.min}以上の整数で入力してください`;
    case "WORK_MEMO_TOO_LONG":
      return `作品メモは${error.max}文字以内で入力してください`;
    case "DUPLICATE_WORK_ID":
      return "作品IDが重複しています。";
    case "NEW_WORK_DELETED":
      return "新規の作品を削除済みにすることはできません。";
    case "DUPLICATE_WORK_TITLE":
      return `作品タイトル「${error.title}」が重複しています。`;
    case "DUPLICATE_WORK_SORT":
      return `表示順「${error.sort}」が重複しています。`;
    case "ALL_DELETED":
      return "作品をすべて削除することはできません。";
    default: {
      // 全てのエラー種別を網羅していることを型で保証する
      error satisfies never;
      return "入力内容が不正です";
    }
  }
}
