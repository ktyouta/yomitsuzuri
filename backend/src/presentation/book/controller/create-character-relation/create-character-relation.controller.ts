import { Hono } from "hono";
import { CreateCharacterRelationUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { CharacterRelationUniquenessDomainService, CharacterValidityDomainService } from "../../../../domain";
import { CharacterRelationUniquenessRepository, CharacterValidityRepository, CreateCharacterRelationRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { CreateCharacterRelationSchema, WorkIdParamSchema } from "../../schema";

/**
 * 登場人物関係作成
 */
const createCharacterRelation = new Hono<AppEnv>().post(
  API_ENDPOINT.WORKS_ID_CHARACTER_RELATIONS,
  authMiddleware,
  validatorMiddleware("param", WorkIdParamSchema),
  validatorMiddleware("json", CreateCharacterRelationSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const characterValidityService = new CharacterValidityDomainService(new CharacterValidityRepository(db));
    const uniquenessService = new CharacterRelationUniquenessDomainService(new CharacterRelationUniquenessRepository(db));
    const usecase = new CreateCharacterRelationUsecase(new CreateCharacterRelationRepository(db), characterValidityService, uniquenessService);

    const result = await usecase.execute({ userId: user.userId, workId: param.workId, body });

    return result.match(
      (dto) => c.json({ message: "人物関係を登録しました。", data: dto.value }, HTTP_STATUS.CREATED),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の作品の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "作品が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "CHARACTER_RELATION_SELF":
            return c.json({ message: "入力エラー", data: [{ field: "targetCharacterId", message: "人物と相手には別の登場人物を指定してください。" }] }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          case "INVALID_CHARACTER":
            return c.json({ message: "入力エラー", data: error.fields.map((field) => ({ field, message: "指定された登場人物は存在しません。" })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          case "DUPLICATE_RELATION":
            return c.json({ message: "同じ関係が既に登録されています。" }, HTTP_STATUS.CONFLICT);
          case "DUPLICATE_DELETED_RELATION":
            return c.json({ message: "同じ関係が既に登録されています（削除済み）。復元するか、別の関係名にしてください。" }, HTTP_STATUS.CONFLICT);
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

export { createCharacterRelation };
