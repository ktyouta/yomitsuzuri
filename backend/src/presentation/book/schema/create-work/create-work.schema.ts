import { z } from "zod";

/**
 * 作品追加リクエストスキーマ
 *
 * bookId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数・形式等）は値オブジェクト、作品名の重複は集約（BookAggregate）で判定する。
 */
export const CreateWorkSchema = z.object({
  title: z.string(),
  memo: z.string().nullish(),
  iconId: z.number(),
});
