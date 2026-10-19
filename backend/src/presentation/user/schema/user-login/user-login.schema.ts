import { z } from "zod";

/**
 * ログインリクエストスキーマ
 *
 * 型・構造のみを検証する。空かどうかは値オブジェクトで判定する。
 */
export const UserLoginSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export type UserLoginSchemaType = z.infer<typeof UserLoginSchema>;
