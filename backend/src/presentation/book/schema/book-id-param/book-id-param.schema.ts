import { z } from "zod";

/**
 * 書籍IDパラメータスキーマ
 *
 * 型のみを検証する。形式が不正・存在しない書籍IDは、書籍の取得で見つからないため 404 になる。
 */
export const BookIdParamSchema = z.object({
  bookId: z.string(),
});

export type BookIdParamSchemaType = z.infer<typeof BookIdParamSchema>;
