import { Hono } from "hono";
import { GetListCharacterUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { GetListCharacterRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { WorkIdParamSchema } from "../../schema";

/**
 * 登場人物一覧取得
 */
const getListCharacter = new Hono<AppEnv>().get(
  API_ENDPOINT.WORKS_ID_CHARACTERS,
  authMiddleware,
  validatorMiddleware("param", WorkIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const repository = new GetListCharacterRepository(db);
    const usecase = new GetListCharacterUsecase(repository);

    const result = await usecase.execute({ userId: user.userId, workId: param.workId });

    return result.match(
      (dto) => c.json({ message: "登場人物一覧を取得しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の作品の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "作品が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
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

export { getListCharacter };
