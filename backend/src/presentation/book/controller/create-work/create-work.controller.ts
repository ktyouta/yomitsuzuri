import { Hono } from "hono";
import { CreateWorkUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { IconValidityDomainService } from "../../../../domain";
import { CreateWorkRepository, IconValidityRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { BookIdParamSchema, CreateWorkSchema } from "../../schema";

/**
 * 作品追加（書籍に作品を追加し、表示順の末尾に置く）
 */
const createWork = new Hono<AppEnv>().post(
  API_ENDPOINT.BOOKS_ID_WORKS,
  authMiddleware,
  validatorMiddleware("param", BookIdParamSchema),
  validatorMiddleware("json", CreateWorkSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const iconValidityService = new IconValidityDomainService(new IconValidityRepository(db));
    const usecase = new CreateWorkUsecase(new CreateWorkRepository(db), iconValidityService);

    const result = await usecase.execute({ userId: user.userId, bookId: param.bookId, body });

    return result.match(
      (dto) => c.json({ message: "作品を登録しました。", data: dto.value }, HTTP_STATUS.CREATED),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "書籍が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "DUPLICATE_WORK_TITLE":
            return c.json({ message: "同名の作品が既に登録されています。" }, HTTP_STATUS.CONFLICT);
          case "DUPLICATE_DELETED_WORK_TITLE":
            return c.json({ message: "同名の作品が既に登録されています（削除済み）。復元するか、別のタイトルにしてください。" }, HTTP_STATUS.CONFLICT);
          case "INVALID_ICON":
            return c.json({ message: "指定されたアイコンは存在しません。" }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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

export { createWork };
