import { Hono } from "hono";
import { GetEventUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetEventRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { EventIdParamSchema } from "../../schema";

/**
 * 出来事詳細取得
 */
const getEvent = new Hono<AppEnv>().get(
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
    const repository = new GetEventRepository(db);
    const usecase = new GetEventUsecase(repository);

    const result = await usecase.execute({ userId: user.userId, eventId: param.eventId });

    return result.match(
      (dto) => c.json({ message: "出来事詳細を取得しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の出来事の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "出来事が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          default: {
            // 全てのエラー種別を網羅していることを型で保証する（エラー種別が1つのため error 自体は絞り込まれず、type で判定する）
            error.type satisfies never;
            return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
          }
        }
      },
    );
  }
);

export { getEvent };
