import { z } from "zod";
import { BookListPagination } from "../../../../domain";

/**
 * 削除済みの書籍一覧取得クエリスキーマ
 *
 * クエリは文字列で届くため、数値への変換と省略時の既定値のみを行う。
 * ページ番号・日時・並び順として正しいか（数値に変換できない値を含む）は値オブジェクト（BookListPagination・Timestamp・BookListSort）で判定し、不正な値は Usecase で無視する。
 */
export const GetListDeletedBookQuerySchema = z.object({
  keyword: z.string().optional(),
  createdAtFrom: z.string().optional(),
  createdAtTo: z.string().optional(),
  updatedAtFrom: z.string().optional(),
  updatedAtTo: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().default(String(BookListPagination.MIN_PAGE)).transform(Number),
});
