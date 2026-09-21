import { z } from "zod";


export const UpdatePasswordRequestSchema = z.object({
    nowPassword: z.string()
        .nonempty("現在のパスワードを入力してください"),
    newPassword: z.string()
        .nonempty("パスワードを入力してください")
        .min(8, "パスワードは8文字以上で入力してください")
        .regex(/^[\x21-\x7E]+$/, "パスワードは半角英数記号で入力してください"),
    confirmPassword: z.string()
        .nonempty("確認用パスワードを入力してください"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmPassword"]
});

export type UpdatePasswordRequestType = z.infer<typeof UpdatePasswordRequestSchema>;