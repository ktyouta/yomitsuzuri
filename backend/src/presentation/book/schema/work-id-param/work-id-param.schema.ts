import { z } from "zod";

/**
 * 作品IDパラメータスキーマ
 *
 * 型のみを検証する。形式が不正・存在しない作品IDは、作品の取得で見つからないため 404 になる。
 */
export const WorkIdParamSchema = z.object({
  workId: z.string(),
});

export type WorkIdParamSchemaType = z.infer<typeof WorkIdParamSchema>;
