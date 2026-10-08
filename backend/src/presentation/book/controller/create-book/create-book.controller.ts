import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { CreateBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { BookTitleUniquenessDomainService, IconValidityDomainService } from "../../../../domain";
import { BookTitleUniquenessRepository, CreateBookRepository, IconValidityRepository } from "../../../../infrastructure";
import { authMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { formatZodErrors } from "../../../../util";
import { CreateBookSchema } from "../../schema";

/**
 * 書籍作成
 */
const createBook = new Hono<AppEnv>().post(
  API_ENDPOINT.BOOKS,
  authMiddleware,
  zValidator("json", CreateBookSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const body = c.req.valid("json");
    const db = c.get('db');
    const uniquenessService = new BookTitleUniquenessDomainService(new BookTitleUniquenessRepository(db));
    const iconValidityService = new IconValidityDomainService(new IconValidityRepository(db));
    const usecase = new CreateBookUsecase(new CreateBookRepository(db), uniquenessService, iconValidityService);

    const result = await usecase.execute({ userId: user.userId, body });

    return result.match(
      (dto) => c.json({ message: "書籍を登録しました。", data: dto.value }, HTTP_STATUS.CREATED),
      (error) => {
        switch (error.type) {
          case "DUPLICATE_TITLE":
            return c.json({ message: "同名の書籍が既に登録されています。" }, HTTP_STATUS.CONFLICT);
          case "INVALID_ICON":
            return c.json({ message: "入力エラー", data: [{ field: "icon", message: "指定されたアイコンは存在しません。" }] }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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

export { createBook };
