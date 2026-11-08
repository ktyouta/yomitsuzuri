import { z } from "zod";

/**
 * 作品更新リクエストスキーマ
 *
 * workId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数・形式等）は値オブジェクト、作品名の重複は集約（BookAggregate）で判定する。
 * updatedAt は画面の表示時点の作品の更新日時（排他チェックに使う）。
 */
export const UpdateWorkSchema = z.object({
  title: z.string(),
  memo: z.string().nullish(),
  iconId: z.number(),
  updatedAt: z.string(),
});
