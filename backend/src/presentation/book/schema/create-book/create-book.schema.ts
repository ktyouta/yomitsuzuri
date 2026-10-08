import { z } from "zod";
import { BookMemo, BookTitle, CurrentPage, IconId, PublishedDate } from "../../../../domain/book";

const PUBLISHED_DATE_ERROR_MESSAGE = "出版日はYYYY / YYYY-MM / YYYY-MM-DDの形式で、実在する日付を入力してください";

/**
 * 出版日として受け付けられるかを判定する
 * 形式・実在日付の判定は PublishedDate 値オブジェクトを単一権威とする
 * @param publishedDate 出版日
 * @returns 受け付けられる場合 true
 */
function isValidPublishedDate(publishedDate: string): boolean {
  try {
    new PublishedDate(publishedDate);
    return true;
  } catch {
    return false;
  }
}

/**
 * 書籍作成リクエストスキーマ
 *
 * userId は認証情報から取得するためボディには含めない。
 */
export const CreateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(BookTitle.TITLE_MAX_LENGTH, `タイトルは${BookTitle.TITLE_MAX_LENGTH}文字以内で入力してください`),
  publishedDate: z
    .string()
    .refine(isValidPublishedDate, PUBLISHED_DATE_ERROR_MESSAGE)
    .nullish(),
  currentPage: z
    .number()
    .int("現在のページ数は0以上の整数で入力してください")
    .min(CurrentPage.MIN_VALUE, "現在のページ数は0以上の整数で入力してください")
    .nullish(),
  memo: z
    .string()
    .trim()
    .max(BookMemo.MEMO_MAX_LENGTH, `メモは${BookMemo.MEMO_MAX_LENGTH}文字以内で入力してください`)
    .nullish(),
  // 実在確認・有効性確認は Usecase 層（IconValidityDomainService）で行うため、ここでは構造チェックのみ
  icon: z
    .number()
    .int("アイコンIDが不正です")
    .min(IconId.MIN_VALUE, "アイコンIDが不正です"),
});

export type CreateBookSchemaType = z.infer<typeof CreateBookSchema>;
