import { Hono } from "hono";
import { CreateCharacterUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { CharacterNameUniquenessDomainService, GenderValidityDomainService } from "../../../../domain";
import { CharacterNameUniquenessRepository, CreateCharacterRepository, GenderValidityRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { CreateCharacterSchema, WorkIdParamSchema } from "../../schema";

/**
 * 登場人物作成
 */
const createCharacter = new Hono<AppEnv>().post(
  API_ENDPOINT.WORKS_ID_CHARACTERS,
  authMiddleware,
  validatorMiddleware("param", WorkIdParamSchema),
  validatorMiddleware("json", CreateCharacterSchema),
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
    const usecase = new CreateCharacterUsecase(new CreateCharacterRepository(db), uniquenessService, genderValidityService);

    const result = await usecase.execute({ userId: user.userId, workId: param.workId, body });

    return result.match(
      (dto) => c.json({ message: "登場人物を登録しました。", data: dto.value }, HTTP_STATUS.CREATED),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの書籍の作品の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
            return c.json({ message: "作品が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
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

export { createCharacter };
