import { Hono } from "hono";
import { DeleteCharacterUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { DeleteCharacterRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { CharacterIdParamSchema } from "../../schema";

/**
 * 登場人物削除
 */
const deleteCharacter = new Hono<AppEnv>().delete(
  API_ENDPOINT.CHARACTERS_ID,
  authMiddleware,
  validatorMiddleware("param", CharacterIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const usecase = new DeleteCharacterUsecase(new DeleteCharacterRepository(db));

    const result = await usecase.execute({ userId: user.userId, characterId: param.characterId });

    return result.match(
      () => c.json({ message: "登場人物を削除しました。" }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の登場人物の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "登場人物が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "EXISTS_RELATIONS":
            return c.json({ message: "人物関係が登録されているため、登場人物を削除できません。先に人物関係を削除してください。" }, HTTP_STATUS.CONFLICT);
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

export { deleteCharacter };
