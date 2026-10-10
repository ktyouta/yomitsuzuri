import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { CreateBookUsecase, type CreateBookInputError } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { BookTitleUniquenessDomainService, IconValidityDomainService } from "../../../../domain";
import { BookTitleUniquenessRepository, CreateBookRepository, IconValidityRepository } from "../../../../infrastructure";
import { authMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { formatZodErrors } from "../../../../util";
import { CreateBookSchema } from "../../schema";

/**
 * 入力値の制約違反を、利用者向けのメッセージに変換する
 * @param error 値オブジェクトが返した制約違反
 * @returns 利用者向けのメッセージ
 */
function toInputErrorMessage(error: CreateBookInputError["error"]): string {
  switch (error.type) {
    case "BOOK_TITLE_EMPTY":
      return "タイトルは必須です";
    case "BOOK_TITLE_TOO_LONG":
      return `タイトルは${error.max}文字以内で入力してください`;
    case "PUBLISHED_DATE_INVALID_FORMAT":
      return "出版日はYYYY / YYYY-MM / YYYY-MM-DDの形式で入力してください";
    case "PUBLISHED_DATE_NOT_EXIST":
      return "出版日は実在する日付を入力してください";
    case "CURRENT_PAGE_INVALID":
      return `現在のページ数は${error.min}以上の整数で入力してください`;
    case "BOOK_MEMO_TOO_LONG":
      return `メモは${error.max}文字以内で入力してください`;
    case "ICON_ID_INVALID":
      return "アイコンIDが不正です";
    default: {
      // 全てのエラー種別を網羅していることを型で保証する
      error satisfies never;
      return "入力内容が不正です";
    }
  }
}

/**
 * 書籍作成
 */
const createBook = new Hono<AppEnv>().post(
  API_ENDPOINT.BOOKS,
  authMiddleware,
  zValidator("json", CreateBookSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "入力エラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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
