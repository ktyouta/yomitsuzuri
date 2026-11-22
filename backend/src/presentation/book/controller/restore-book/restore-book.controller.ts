import { Hono } from "hono";
import { RestoreBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RestoreBookRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { BookIdParamSchema, RestoreBookSchema } from "../../schema";

/**
 * 書籍復元（論理削除を解除する。著者・作品・作品の配下も一緒に戻す）
 */
const restoreBook = new Hono<AppEnv>().post(
  API_ENDPOINT.BOOKS_ID_RESTORE,
  authMiddleware,
  validatorMiddleware("param", BookIdParamSchema),
  validatorMiddleware("json", RestoreBookSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const usecase = new RestoreBookUsecase(new RestoreBookRepository(db));

    const result = await usecase.execute({ userId: user.userId, bookId: param.bookId, body });

    return result.match(
      (dto) => c.json({ message: "書籍を復元しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "書籍が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "CONFLICT_BOOK":
            return c.json({ message: "書籍が他の画面で更新されています。最新の情報を読み込み直してください。" }, HTTP_STATUS.CONFLICT);
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

export { restoreBook };
