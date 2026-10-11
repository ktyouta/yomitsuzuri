import { z } from "zod";
import { BookListPagination } from "../../../../domain/book";

/**
 * 書籍一覧取得クエリスキーマ
 *
 * クエリは文字列で届くため、数値への変換と省略時の既定値のみを行う。
 * ページ番号として正しいか（数値に変換できない値を含む）は値オブジェクト（BookListPagination）で判定する。
 */
export const GetListBookQuerySchema = z.object({
  page: z.string().default(String(BookListPagination.MIN_PAGE)).transform(Number),
});

export type GetListBookQuerySchemaType = z.infer<typeof GetListBookQuerySchema>;
