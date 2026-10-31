import { z } from "zod";

/**
 * 出来事更新リクエストスキーマ
 *
 * eventId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数・形式等）はドメイン（値オブジェクト）で判定する。
 */
export const UpdateEventSchema = z.object({
  occurredTiming: z.string().nullish(),
  content: z.string(),
});
