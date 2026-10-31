import { z } from "zod";

/**
 * 気になるワード更新リクエストスキーマ
 *
 * wordId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数・形式等）はドメイン（値オブジェクト）で判定する。
 */
export const UpdateWordSchema = z.object({
  text: z.string(),
  memo: z.string().nullish(),
  page: z.number().nullish(),
});
