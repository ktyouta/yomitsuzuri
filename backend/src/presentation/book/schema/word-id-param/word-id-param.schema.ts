import { z } from "zod";

/**
 * 気になるワードIDパラメータスキーマ
 *
 * 型のみを検証する。形式が不正・存在しない気になるワードIDは、気になるワードの取得で見つからないため 404 になる。
 */
export const WordIdParamSchema = z.object({
  wordId: z.string(),
});
