import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { GetListBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetListBookRepository } from "../../../../infrastructure";
import { authMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { formatZodErrors } from "../../../../util";
import { GetListBookQuerySchema } from "../../schema";

/**
 * 書籍一覧取得
 */
const getListBook = new Hono<AppEnv>().get(
  API_ENDPOINT.BOOKS,
  authMiddleware,
  zValidator("query", GetListBookQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const query = c.req.valid("query");
    const db = c.get('db');
    const repository = new GetListBookRepository(db);
    const usecase = new GetListBookUsecase(repository);

    const result = await usecase.execute(user.userId.value, query.page);

    return c.json({ message: "書籍一覧を取得しました。", data: result.value }, HTTP_STATUS.OK);
  }
);

export { getListBook };
