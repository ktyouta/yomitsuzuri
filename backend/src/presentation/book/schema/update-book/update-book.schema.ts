import { z } from "zod";

/**
 * 作品更新リクエストスキーマ（id が null の場合は新規の作品。作品の削除は書籍の更新では行わない）
 */
const UpdateWorkSchema = z.object({
  id: z.string().nullable(),
  title: z.string(),
  sort: z.number(),
  memo: z.string().nullish(),
  iconId: z.number(),
});

/**
 * 書籍更新リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約（文字数・形式等）は値オブジェクト、
 * 作品の指定の誤り（ID重複等）・不変条件（タイトル・表示順の重複等）は集約（BookAggregate）で判定する。
 */
export const UpdateBookSchema = z.object({
  title: z.string(),
  publishedDate: z.string().nullish(),
  currentPage: z.number().nullish(),
  memo: z.string().nullish(),
  readingStatus: z.number(),
  iconId: z.number(),
  works: z.array(UpdateWorkSchema),
});
