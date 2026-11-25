import { Hono } from "hono";
import { GetListDeletedBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetListDeletedBookRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { GetListDeletedBookQuerySchema } from "../../schema";

/**
 * 削除済みの書籍一覧（ゴミ箱）取得
 */
const getListDeletedBook = new Hono<AppEnv>().get(
  API_ENDPOINT.DELETED_BOOKS,
  authMiddleware,
  validatorMiddleware("query", GetListDeletedBookQuerySchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const query = c.req.valid("query");
    const db = c.get('db');
    const repository = new GetListDeletedBookRepository(db);
    const usecase = new GetListDeletedBookUsecase(repository);

    const dto = await usecase.execute({ userId: user.userId, query });

    return c.json({ message: "ゴミ箱の書籍一覧を取得しました。", data: dto.value }, HTTP_STATUS.OK);
  }
);

export { getListDeletedBook };
