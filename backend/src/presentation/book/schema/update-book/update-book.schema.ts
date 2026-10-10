import { z } from "zod";
import { BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, WorkMemo, WorkSort, WorkTitle } from "../../../../domain/book";

// ULID（Crockford's Base32 の26文字。I・L・O・U は含まない）
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const PUBLISHED_DATE_ERROR_MESSAGE = "出版日はYYYY / YYYY-MM / YYYY-MM-DDの形式で、実在する日付を入力してください";

/**
 * 作品更新リクエストスキーマ（id が null の場合は新規の作品）
 */
const UpdateWorkSchema = z.object({
  id: z.string().regex(ULID_PATTERN, "作品IDの形式が正しくありません").nullable(),
  title: z
    .string()
    .trim()
    .min(1, "作品タイトルは必須です")
    .max(WorkTitle.TITLE_MAX_LENGTH, `作品タイトルは${WorkTitle.TITLE_MAX_LENGTH}文字以内で入力してください`),
  sort: z
    .number()
    .int("表示順は1以上の整数で入力してください")
    .min(WorkSort.FIRST, "表示順は1以上の整数で入力してください"),
  memo: z
    .string()
    .trim()
    .max(WorkMemo.MEMO_MAX_LENGTH, `作品メモは${WorkMemo.MEMO_MAX_LENGTH}文字以内で入力してください`)
    .nullish(),
  deleteFlg: z.boolean(),
}).refine((work) => work.id !== null || !work.deleteFlg, {
  message: "新規の作品を削除済みにすることはできません",
  path: ["deleteFlg"],
});

/**
 * 書籍更新リクエストスキーマ
 *
 * 書籍作成はドメインでの入力値検証へ移行済みだが、書籍更新は未移行のため値の制約もここで検証する。
 * 作品の重複・全件削除などの不変条件は集約（BookAggregate）で判定するため、ここでは構造チェックのみ。
 */
export const UpdateBookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルは必須です")
    .max(BookTitle.TITLE_MAX_LENGTH, `タイトルは${BookTitle.TITLE_MAX_LENGTH}文字以内で入力してください`),
  publishedDate: z
    .string()
    .refine((publishedDate) => PublishedDate.create(publishedDate).isOk(), PUBLISHED_DATE_ERROR_MESSAGE)
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
  readingStatus: z
    .number()
    .int("読書状況が不正です")
    .min(1, "読書状況が不正です"),
  // 実在確認・有効性確認は Usecase 層（IconValidityDomainService）で行うため、ここでは構造チェックのみ
  iconId: z
    .number()
    .int("アイコンIDが不正です")
    .min(IconId.MIN_VALUE, "アイコンIDが不正です"),
  works: z
    .array(UpdateWorkSchema)
    .min(1, "作品は1件以上指定してください")
    .refine((works) => {
      const ids = works.flatMap((work) => work.id ? [work.id] : []);
      return new Set(ids).size === ids.length;
    }, "作品IDが重複しています"),
});

export type UpdateBookSchemaType = z.infer<typeof UpdateBookSchema>;
