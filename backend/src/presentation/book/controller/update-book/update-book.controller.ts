import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { UpdateBookUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { BookId, BookTitleUniquenessDomainService, IconValidityDomainService, ReadingStatusValidityDomainService, type BookValidationError } from "../../../../domain";
import { BookTitleUniquenessRepository, IconValidityRepository, ReadingStatusValidityRepository, UpdateBookRepository } from "../../../../infrastructure";
import { authMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { formatZodErrors } from "../../../../util";
import { BookIdParamSchema, UpdateBookSchema } from "../../schema";

/**
 * 作品の不変条件の違反を、入力エラーのメッセージに変換する
 * @param error 作品の不変条件の違反
 * @returns 利用者向けのメッセージ
 */
function toWorkErrorMessage(error: BookValidationError): string {
  switch (error.type) {
    case "DUPLICATE_WORK_TITLE":
      return `作品タイトル「${error.title}」が重複しています。`;
    case "DUPLICATE_WORK_SORT":
      return `表示順「${error.sort}」が重複しています。`;
    case "ALL_DELETED":
      return "作品をすべて削除することはできません。";
    default: {
      // 全てのエラー種別を網羅していることを型で保証する
      error satisfies never;
      return "作品の指定が不正です。";
    }
  }
}

/**
 * 書籍更新（書籍に収録された作品も、削除済みを含む全件を受け取って更新する）
 */
const updateBook = new Hono<AppEnv>().put(
  API_ENDPOINT.BOOKS_ID,
  authMiddleware,
  zValidator("param", BookIdParamSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }),
  zValidator("json", UpdateBookSchema, (result, c) => {
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
    const body = c.req.valid("json");
    const db = c.get('db');
    const uniquenessService = new BookTitleUniquenessDomainService(new BookTitleUniquenessRepository(db));
    const iconValidityService = new IconValidityDomainService(new IconValidityRepository(db));
    const readingStatusValidityService = new ReadingStatusValidityDomainService(new ReadingStatusValidityRepository(db));
    const usecase = new UpdateBookUsecase(new UpdateBookRepository(db), uniquenessService, iconValidityService, readingStatusValidityService);

    const result = await usecase.execute({ userId: user.userId, bookId: BookId.of(param.bookId), body });

    return result.match(
      (dto) => c.json({ message: "書籍を更新しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "書籍が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "DUPLICATE_TITLE":
            return c.json({ message: "同名の書籍が既に登録されています。" }, HTTP_STATUS.CONFLICT);
          case "INVALID_ICON":
            return c.json({ message: "入力エラー", data: [{ field: "iconId", message: "指定されたアイコンは存在しません。" }] }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          case "INVALID_READING_STATUS":
            return c.json({ message: "入力エラー", data: [{ field: "readingStatus", message: "指定された読書状況は存在しません。" }] }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          case "INVALID_WORKS":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: "works", message: toWorkErrorMessage(e) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
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

export { updateBook };
