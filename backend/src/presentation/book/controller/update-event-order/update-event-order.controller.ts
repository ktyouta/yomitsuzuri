import { Hono } from "hono";
import { UpdateEventOrderUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { UpdateEventOrderRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { UpdateEventOrderSchema, WorkIdParamSchema } from "../../schema";

/**
 * 出来事の並び順更新
 */
const updateEventOrder = new Hono<AppEnv>().put(
  API_ENDPOINT.WORKS_ID_EVENT_ORDER,
  authMiddleware,
  validatorMiddleware("param", WorkIdParamSchema),
  validatorMiddleware("json", UpdateEventOrderSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const usecase = new UpdateEventOrderUsecase(new UpdateEventOrderRepository(db));

    const result = await usecase.execute({ userId: user.userId, workId: param.workId, body });

    return result.match(
      (dto) => c.json({ message: "出来事の並び順を更新しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の作品の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "作品が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "EVENT_MISMATCH":
            return c.json({ message: "出来事が他の画面で変更されています。最新の情報を読み込み直してください。" }, HTTP_STATUS.CONFLICT);
          case "DUPLICATE_SORT_ORDER":
            return c.json({ message: "入力エラー", data: [{ field: "events", message: toInputErrorMessage(error) }] }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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

export { updateEventOrder };
