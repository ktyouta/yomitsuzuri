import { z } from "zod";

/**
 * パスワード変更リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約は値オブジェクト、確認用パスワードの一致は Usecase で判定する。
 */
export const UpdatePasswordSchema = z.object({
  nowPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});

export type UpdatePasswordSchemaType = z.infer<typeof UpdatePasswordSchema>;
