import { z } from "zod";

export const LoginRequestSchema = z.object({
    name: z.string().min(1, "ユーザー名を入力してください"),
    password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginRequestType = z.infer<typeof LoginRequestSchema>;