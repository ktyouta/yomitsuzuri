import { Hono } from "hono";
import { RestoreCharacterUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RestoreCharacterRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { CharacterIdParamSchema } from "../../schema";

/**
 * 登場人物復元（論理削除を解除する）
 */
const restoreCharacter = new Hono<AppEnv>().post(
  API_ENDPOINT.CHARACTERS_ID_RESTORE,
  authMiddleware,
  validatorMiddleware("param", CharacterIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const usecase = new RestoreCharacterUsecase(new RestoreCharacterRepository(db));

    const result = await usecase.execute({ userId: user.userId, characterId: param.characterId });

    return result.match(
      (dto) => c.json({ message: "登場人物を復元しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の登場人物の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "登場人物が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
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

export { restoreCharacter };
