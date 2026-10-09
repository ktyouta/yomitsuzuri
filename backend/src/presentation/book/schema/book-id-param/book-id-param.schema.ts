import { z } from "zod";

// ULID（Crockford's Base32 の26文字。I・L・O・U は含まない）
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/**
 * 書籍IDパラメータスキーマ
 */
export const BookIdParamSchema = z.object({
  bookId: z.string().regex(ULID_PATTERN, "書籍IDの形式が正しくありません"),
});

export type BookIdParamSchemaType = z.infer<typeof BookIdParamSchema>;
