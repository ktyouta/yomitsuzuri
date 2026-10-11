import { z } from "zod";

/**
 * ユーザー更新リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約は値オブジェクトで判定する。
 */
export const UpdateUserSchema = z.object({
  name: z.string(),
  birthday: z.string(),
});

export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>;
