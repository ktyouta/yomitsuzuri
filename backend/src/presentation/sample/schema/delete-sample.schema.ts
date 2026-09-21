import { z } from "zod";

/**
 * サンプル削除パラメータスキーマ
 */
export const DeleteSampleParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "IDは数値で指定してください"),
});

export type DeleteSampleParamSchemaType = z.infer<typeof DeleteSampleParamSchema>;
