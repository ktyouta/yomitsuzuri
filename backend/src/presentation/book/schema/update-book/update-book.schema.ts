import { z } from "zod";
import { WorkMemo, WorkSort, WorkTitle } from "../../../../domain/book";
import { CreateBookSchema } from "../create-book";

// ULID（Crockford's Base32 の26文字。I・L・O・U は含まない）
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

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
 * 書籍項目の入力規則は書籍作成と同じため CreateBookSchema から引き継ぐ。
 * 作品の重複・全件削除などの不変条件は集約（BookAggregate）で判定するため、ここでは構造チェックのみ。
 */
export const UpdateBookSchema = CreateBookSchema.omit({ icon: true }).extend({
  readingStatus: z
    .number()
    .int("読書状況が不正です")
    .min(1, "読書状況が不正です"),
  // 実在確認・有効性確認は Usecase 層（IconValidityDomainService）で行うため、ここでは構造チェックのみ
  iconId: CreateBookSchema.shape.icon,
  works: z
    .array(UpdateWorkSchema)
    .min(1, "作品は1件以上指定してください")
    .refine((works) => {
      const ids = works.flatMap((work) => work.id ? [work.id] : []);
      return new Set(ids).size === ids.length;
    }, "作品IDが重複しています"),
});

export type UpdateBookSchemaType = z.infer<typeof UpdateBookSchema>;
