import { z } from "zod";

/**
 * 出来事作成リクエストスキーマ
 *
 * workId はパスパラメータから取得するためボディには含めない。時系列順はサーバーで末尾に採番するため受け取らない。
 * 型・構造のみを検証する。値の制約（文字数等）はドメイン（値オブジェクト）で判定する。
 */
export const CreateEventSchema = z.object({
  occurredTiming: z.string().nullish(),
  content: z.string(),
});

export type CreateEventSchemaType = z.infer<typeof CreateEventSchema>;
