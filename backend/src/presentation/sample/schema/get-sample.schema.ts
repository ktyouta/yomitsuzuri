import { z } from "zod";

/**
 * サンプルIDパラメータスキーマ
 */
export const GetSampleParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "IDは数値で指定してください"),
});

export type GetSampleParamSchemaType = z.infer<typeof GetSampleParamSchema>;
