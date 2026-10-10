import { z } from "zod";

/**
 * 書籍作成リクエストスキーマ
 *
 * userId は認証情報から取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数・形式等）はドメイン（値オブジェクト）で判定する。
 */
export const CreateBookSchema = z.object({
  title: z.string(),
  publishedDate: z.string().nullish(),
  currentPage: z.number().nullish(),
  memo: z.string().nullish(),
  icon: z.number(),
});

export type CreateBookSchemaType = z.infer<typeof CreateBookSchema>;
