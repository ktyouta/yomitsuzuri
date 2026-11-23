import { z } from "zod";

/**
 * 書籍の物理削除リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約（形式等）は値オブジェクトで判定する。
 * updatedAt は画面の表示時点の書籍の更新日時（排他チェックに使う）。
 */
export const HardDeleteBookSchema = z.object({
  updatedAt: z.string(),
});
