import { z } from "zod";

/**
 * 作品の物理削除リクエストスキーマ
 *
 * workId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（形式等）は値オブジェクトで判定する。
 * updatedAt は画面の表示時点の作品の更新日時（排他チェックに使う）。
 */
export const HardDeleteWorkSchema = z.object({
  updatedAt: z.string(),
});
