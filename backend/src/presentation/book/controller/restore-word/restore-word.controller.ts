import { Hono } from "hono";
import { RestoreWordUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RestoreWordRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { WordIdParamSchema } from "../../schema";

/**
 * 気になるワード復元（論理削除を解除する）
 */
const restoreWord = new Hono<AppEnv>().post(
  API_ENDPOINT.WORDS_ID_RESTORE,
  authMiddleware,
  validatorMiddleware("param", WordIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const usecase = new RestoreWordUsecase(new RestoreWordRepository(db));

    const result = await usecase.execute({ userId: user.userId, wordId: param.wordId });

    return result.match(
      (dto) => c.json({ message: "気になるワードを復元しました。", data: dto.value }, HTTP_STATUS.OK),
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

export { restoreWord };
