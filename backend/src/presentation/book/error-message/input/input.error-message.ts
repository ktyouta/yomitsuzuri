import type { BookListPaginationError, BookMemoError, BookTitleError, BookValidationError, CharacterAgeError, CharacterCharacteristicError, CharacterMemoError, CharacterNameError, CharacterOccupationError, CurrentPageError, GenderIdError, IconIdError, PublishedDateError, ReadingStatusIdError, WorkMemoError, WorkSortError, WorkTitleError } from "../../../../domain";

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
  | WorkTitleError
  | WorkSortError
  | WorkMemoError
  | BookValidationError
  | BookListPaginationError
  | CharacterNameError
  | CharacterAgeError
  | GenderIdError
  | CharacterOccupationError
  | CharacterCharacteristicError
  | CharacterMemoError;

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
    case "BOOK_LIST_PAGE_INVALID":
      return `ページ番号は${error.min}以上の整数で指定してください`;
    case "CHARACTER_NAME_EMPTY":
      return "名前は必須です";
    case "CHARACTER_NAME_TOO_LONG":
      return `名前は${error.max}文字以内で入力してください`;
    case "CHARACTER_AGE_TOO_LONG":
      return `年齢は${error.max}文字以内で入力してください`;
    case "GENDER_ID_INVALID":
      return "性別が不正です";
    case "CHARACTER_OCCUPATION_TOO_LONG":
      return `職業は${error.max}文字以内で入力してください`;
    case "CHARACTER_CHARACTERISTIC_TOO_LONG":
      return `特徴は${error.max}文字以内で入力してください`;
    case "CHARACTER_MEMO_TOO_LONG":
      return `メモは${error.max}文字以内で入力してください`;
    default: {
      // 全てのエラー種別を網羅していることを型で保証する
      error satisfies never;
      return "入力内容が不正です";
    }
  }
}
