import { Hono } from "hono";
import { GetListBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetListBookRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
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

    const dto = await usecase.execute({ userId: user.userId, query });

    return c.json({ message: "書籍一覧を取得しました。", data: dto.value }, HTTP_STATUS.OK);
  }
);

export { getListBook };
