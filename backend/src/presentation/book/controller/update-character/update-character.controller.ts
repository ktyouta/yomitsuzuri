import { Hono } from "hono";
import { UpdateCharacterUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { CharacterNameUniquenessDomainService, GenderValidityDomainService } from "../../../../domain";
import { CharacterNameUniquenessRepository, GenderValidityRepository, UpdateCharacterRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { CharacterIdParamSchema, UpdateCharacterSchema } from "../../schema";

/**
 * 登場人物更新
 */
const updateCharacter = new Hono<AppEnv>().put(
  API_ENDPOINT.CHARACTERS_ID,
  authMiddleware,
  validatorMiddleware("param", CharacterIdParamSchema),
  validatorMiddleware("json", UpdateCharacterSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const uniquenessService = new CharacterNameUniquenessDomainService(new CharacterNameUniquenessRepository(db));
    const genderValidityService = new GenderValidityDomainService(new GenderValidityRepository(db));
    const usecase = new UpdateCharacterUsecase(new UpdateCharacterRepository(db), uniquenessService, genderValidityService);

    const result = await usecase.execute({ userId: user.userId, characterId: param.characterId, body });

    return result.match(
      (dto) => c.json({ message: "登場人物を更新しました。", data: dto.value }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の登場人物の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "登場人物が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "INVALID_GENDER":
            return c.json({ message: "入力エラー", data: [{ field: "genderId", message: "指定された性別は存在しません。" }] }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          case "DUPLICATE_NAME":
            return c.json({ message: "同名の登場人物が既に登録されています。" }, HTTP_STATUS.CONFLICT);
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

export { updateCharacter };
