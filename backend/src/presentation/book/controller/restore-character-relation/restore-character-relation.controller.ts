import { Hono } from "hono";
import { RestoreCharacterRelationUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { CharacterValidityDomainService } from "../../../../domain";
import { CharacterValidityRepository, RestoreCharacterRelationRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { CharacterRelationIdParamSchema } from "../../schema";

/**
 * 登場人物関係復元（論理削除を解除する）
 */
const restoreCharacterRelation = new Hono<AppEnv>().post(
  API_ENDPOINT.CHARACTER_RELATIONS_ID_RESTORE,
  authMiddleware,
  validatorMiddleware("param", CharacterRelationIdParamSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const db = c.get('db');
    const characterValidityService = new CharacterValidityDomainService(new CharacterValidityRepository(db));
    const usecase = new RestoreCharacterRelationUsecase(new RestoreCharacterRelationRepository(db), characterValidityService);

    const result = await usecase.execute({ userId: user.userId, characterRelationId: param.relationId });

    return result.match(
      (dto) => c.json({ message: "人物関係を復元しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          // 他ユーザーの書籍の登場人物関係の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "人物関係が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "DELETED_CHARACTER":
            return c.json({ message: "人物または相手が削除されているため復元できません。先に登場人物を復元してください。" }, HTTP_STATUS.CONFLICT);
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

export { restoreCharacterRelation };
