import { z } from "zod";

/**
 * サンプル作成リクエストスキーマ
 */
export const CreateSampleSchema = z.object({
  name: z
    .string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
});

export type CreateSampleSchemaType = z.infer<typeof CreateSampleSchema>;
