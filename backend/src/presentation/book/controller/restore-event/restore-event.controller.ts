import { Hono } from "hono";
import { RestoreEventUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RestoreEventRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { EventIdParamSchema } from "../../schema";

/**
 * 出来事復元（論理削除を解除し、時系列順の末尾に戻す）
 */
const restoreEvent = new Hono<AppEnv>().post(
  API_ENDPOINT.EVENTS_ID_RESTORE,
  authMiddleware,
  validatorMiddleware("param", EventIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const usecase = new RestoreEventUsecase(new RestoreEventRepository(db));

    const result = await usecase.execute({ userId: user.userId, eventId: param.eventId });

    return result.match(
      (dto) => c.json({ message: "出来事を復元しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の出来事の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
          // 削除されていない出来事は、他の復元 API と同じく存在しない場合と同じ応答にする
          case "EVENT_NOT_FOUND":
            return c.json({ message: "出来事が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          default: {
            // 全てのエラー種別を網羅していることを型で保証する
            error satisfies never;
            return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
          }
        }
      },
    );
  }
);

export { restoreEvent };
