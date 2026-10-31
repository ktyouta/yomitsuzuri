import { Hono } from "hono";
import { UpdateEventUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { UpdateEventRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { EventIdParamSchema, UpdateEventSchema } from "../../schema";

/**
 * 出来事更新
 */
const updateEvent = new Hono<AppEnv>().put(
  API_ENDPOINT.EVENTS_ID,
  authMiddleware,
  validatorMiddleware("param", EventIdParamSchema),
  validatorMiddleware("json", UpdateEventSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const usecase = new UpdateEventUsecase(new UpdateEventRepository(db));

    const result = await usecase.execute({ userId: user.userId, eventId: param.eventId, body });

    return result.match(
      (dto) => c.json({ message: "出来事を更新しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の出来事の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
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

export { updateEvent };
