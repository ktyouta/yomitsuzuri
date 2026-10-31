import { Hono } from "hono";
import { DeleteEventUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { DeleteEventRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { EventIdParamSchema } from "../../schema";

/**
 * 出来事削除
 */
const deleteEvent = new Hono<AppEnv>().delete(
  API_ENDPOINT.EVENTS_ID,
  authMiddleware,
  validatorMiddleware("param", EventIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const usecase = new DeleteEventUsecase(new DeleteEventRepository(db));

    const result = await usecase.execute({ userId: user.userId, eventId: param.eventId });

    return result.match(
      () => c.json({ message: "出来事を削除しました。" }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の出来事の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "出来事が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          default: {
            // 全てのエラー種別を網羅していることを型で保証する
            error.type satisfies never;
            return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
          }
        }
      },
    );
  }
);

export { deleteEvent };
