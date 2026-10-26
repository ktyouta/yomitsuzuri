import { Hono } from "hono";
import { DeleteWordUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { DeleteWordRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { WordIdParamSchema } from "../../schema";

/**
 * 気になるワード削除
 */
const deleteWord = new Hono<AppEnv>().delete(
  API_ENDPOINT.WORDS_ID,
  authMiddleware,
  validatorMiddleware("param", WordIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const usecase = new DeleteWordUsecase(new DeleteWordRepository(db));

    const result = await usecase.execute({ userId: user.userId, wordId: param.wordId });

    return result.match(
      () => c.json({ message: "気になるワードを削除しました。" }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の気になるワードの存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "気になるワードが見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          default: {
            // 全てのエラー種別を網羅していることを型で保証する
            error.type satisfies never;
            return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
          }
        }
      },
    );
  }
);

export { deleteWord };
