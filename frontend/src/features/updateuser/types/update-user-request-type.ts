import { z } from "zod";


export const UpdateUserRequestSchema = z.object({
    name: z.string()
        .nonempty("ユーザー名を入力してください")
        .min(3, "ユーザー名は3文字以上で入力してください")
        .max(30, "ユーザー名は30文字以内で入力してください"),
    birthday: z.object({
        year: z.string().min(1, "年を選択してください"),
        month: z.string().min(1, "月を選択してください"),
        day: z.string().min(1, "日を選択してください"),
    }).refine((data) => data.year && data.month && data.day, {
        message: "年月日をすべて選択してください",
    }),
});

export type UpdateUserRequestType = z.infer<typeof UpdateUserRequestSchema>;