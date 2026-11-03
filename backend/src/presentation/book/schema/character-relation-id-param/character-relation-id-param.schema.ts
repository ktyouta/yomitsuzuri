import { z } from "zod";

/**
 * 登場人物関係IDパラメータスキーマ
 *
 * 型のみを検証する。形式が不正・存在しない登場人物関係IDは、登場人物関係の照合で見つからないため 404 になる。
 */
export const CharacterRelationIdParamSchema = z.object({
  relationId: z.string(),
});
