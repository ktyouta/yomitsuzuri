import { z } from "zod";

/**
 * 出来事の時系列順の指定スキーマ
 */
const UpdateEventOrderItemSchema = z.object({
  id: z.string(),
  sortOrder: z.number(),
});

/**
 * 出来事の並び順更新リクエストスキーマ
 *
 * workId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（空・範囲等）は値オブジェクト、
 * 出来事の指定の誤り（過不足・時系列順の重複）は集約（EventTimelineAggregate）で判定する。
 */
export const UpdateEventOrderSchema = z.object({
  events: z.array(UpdateEventOrderItemSchema),
});
