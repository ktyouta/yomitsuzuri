import { z } from "zod";

/**
 * 作品削除リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約（形式等）は値オブジェクトで判定する。
 * updatedAt は画面の表示時点の作品の更新日時（排他チェックに使う）。
 */
export const DeleteWorkSchema = z.object({
  updatedAt: z.string(),
});
