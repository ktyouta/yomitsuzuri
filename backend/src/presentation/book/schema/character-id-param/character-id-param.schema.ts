import { z } from "zod";

/**
 * 登場人物IDパラメータスキーマ
 *
 * 型のみを検証する。形式が不正・存在しない登場人物IDは、登場人物の取得で見つからないため 404 になる。
 */
export const CharacterIdParamSchema = z.object({
  characterId: z.string(),
});

export type CharacterIdParamSchemaType = z.infer<typeof CharacterIdParamSchema>;
