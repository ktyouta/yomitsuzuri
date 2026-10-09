import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { GetBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetBookRepository } from "../../../../infrastructure";
import { authMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { formatZodErrors } from "../../../../util";
import { BookIdParamSchema } from "../../schema";

/**
 * 書籍詳細取得
 */
const getBook = new Hono<AppEnv>().get(
  API_ENDPOINT.BOOKS_ID,
  authMiddleware,
  zValidator("param", BookIdParamSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const repository = new GetBookRepository(db);
    const usecase = new GetBookUsecase(repository);

    const result = await usecase.execute(user.userId, param.bookId);

    return result.match(
      (dto) => c.json({ message: "書籍詳細を取得しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "書籍が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
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

export { getBook };
