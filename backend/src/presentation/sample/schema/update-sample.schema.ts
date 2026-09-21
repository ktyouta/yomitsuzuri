import { z } from "zod";

/**
 * サンプル更新リクエストスキーマ
 */
export const UpdateSampleSchema = z.object({
  name: z
    .string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください")
    .optional(),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
});

export type UpdateSampleSchemaType = z.infer<typeof UpdateSampleSchema>;

/**
 * サンプル更新パラメータスキーマ
 */
export const UpdateSampleParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "IDは数値で指定してください"),
});

export type UpdateSampleParamSchemaType = z.infer<typeof UpdateSampleParamSchema>;
