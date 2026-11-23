import { Hono } from "hono";
import { GetDeletedBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetDeletedBookRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { BookIdParamSchema } from "../../schema";

/**
 * 削除済みの書籍詳細（ゴミ箱の詳細）取得
 */
const getDeletedBook = new Hono<AppEnv>().get(
  API_ENDPOINT.DELETED_BOOKS_ID,
  authMiddleware,
  validatorMiddleware("param", BookIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const repository = new GetDeletedBookRepository(db);
    const usecase = new GetDeletedBookUsecase(repository);

    const result = await usecase.execute({ userId: user.userId, bookId: param.bookId });

    return result.match(
      (dto) => c.json({ message: "ゴミ箱の書籍詳細を取得しました。", data: dto.value }, HTTP_STATUS.OK),
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

export { getDeletedBook };
