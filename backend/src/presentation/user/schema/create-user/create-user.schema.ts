import { z } from "zod";

/**
 * ユーザー作成リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約は値オブジェクト、確認用パスワードの一致は Usecase で判定する。
 */
export const CreateUserSchema = z.object({
  name: z.string(),
  birthday: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
});

export type CreateUserSchemaType = z.infer<typeof CreateUserSchema>;
