import { Hono } from "hono";
import { GetListBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetListBookRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { GetListBookQuerySchema } from "../../schema";

/**
 * 書籍一覧取得
 */
const getListBook = new Hono<AppEnv>().get(
  API_ENDPOINT.BOOKS,
  authMiddleware,
  validatorMiddleware("query", GetListBookQuerySchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const query = c.req.valid("query");
    const db = c.get('db');
    const repository = new GetListBookRepository(db);
    const usecase = new GetListBookUsecase(repository);

    const result = await usecase.execute(user.userId, query.page);

    return result.match(
      (dto) => c.json({ message: "書籍一覧を取得しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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

export { getListBook };
