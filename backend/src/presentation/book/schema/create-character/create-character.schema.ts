import { z } from "zod";

/**
 * 登場人物作成リクエストスキーマ
 *
 * workId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数・形式等）はドメイン（値オブジェクト）で判定する。
 */
export const CreateCharacterSchema = z.object({
  name: z.string(),
  age: z.string().nullish(),
  genderId: z.number().nullish(),
  occupation: z.string().nullish(),
  characteristic: z.string().nullish(),
  memo: z.string().nullish(),
});
