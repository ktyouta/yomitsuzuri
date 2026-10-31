import { z } from "zod";

/**
 * 出来事IDパラメータスキーマ
 *
 * 型のみを検証する。形式が不正・存在しない出来事IDは、出来事の取得で見つからないため 404 になる。
 */
export const EventIdParamSchema = z.object({
  eventId: z.string(),
});
