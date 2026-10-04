import { z } from "zod";

export const UserLoginSchema = z.object({
  name: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type UserLoginSchemaType = z.infer<typeof UserLoginSchema>;
