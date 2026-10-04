import { z } from "zod";
import { BookListPagination } from "../../../../domain/book";

const PAGE_ERROR_MESSAGE = "ページ番号は1以上の整数で指定してください";

export const GetListBookQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: PAGE_ERROR_MESSAGE })
    .int(PAGE_ERROR_MESSAGE)
    .min(BookListPagination.MIN_PAGE, PAGE_ERROR_MESSAGE)
    .default(BookListPagination.MIN_PAGE),
});

export type GetListBookQuerySchemaType = z.infer<typeof GetListBookQuerySchema>;
