import { Hono } from "hono";
import { UpdateWordUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { WordTextUniquenessDomainService } from "../../../../domain";
import { UpdateWordRepository, WordTextUniquenessRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { UpdateWordSchema, WordIdParamSchema } from "../../schema";

/**
 * 気になるワード更新
 */
const updateWord = new Hono<AppEnv>().put(
  API_ENDPOINT.WORDS_ID,
  authMiddleware,
  validatorMiddleware("param", WordIdParamSchema),
  validatorMiddleware("json", UpdateWordSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const uniquenessService = new WordTextUniquenessDomainService(new WordTextUniquenessRepository(db));
    const usecase = new UpdateWordUsecase(new UpdateWordRepository(db), uniquenessService);

    const result = await usecase.execute({ userId: user.userId, wordId: param.wordId, body });

    return result.match(
      (dto) => c.json({ message: "気になるワードを更新しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の気になるワードの存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "気になるワードが見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "DUPLICATE_TEXT":
            return c.json({ message: "同じワードが既に登録されています。" }, HTTP_STATUS.CONFLICT);
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

export { updateWord };
