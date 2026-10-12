import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { CreateUserUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RefreshToken } from "../../../../domain";
import { CreateUserRepository } from "../../../../infrastructure";
import { userOperationGuardMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { CreateUserSchema } from "../../schema";

const createUser = new Hono<AppEnv>().post(
    API_ENDPOINT.USER,
    userOperationGuardMiddleware,
    validatorMiddleware("json", CreateUserSchema),
    async (c) => {
        const body = c.req.valid("json");
        const db = c.get('db');
        const config = c.get('envConfig');
        const repository = new CreateUserRepository(db);
        const usecase = new CreateUserUsecase(repository, config);

        const result = await usecase.execute({ body });
        if (result.isErr()) {
            const error = result.error;
            switch (error.type) {
                case "INVALID_INPUT":
                    return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
                case "DUPLICATE_NAME":
                    return c.json({ message: "既にユーザーが存在しています。" }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
                default: {
                    // 全てのエラー種別を網羅していることを型で保証する
                    error satisfies never;
                    return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
                }
            }
        }

        const { accessToken, refreshToken, user } = result.value.value;

        setCookie(c, RefreshToken.COOKIE_KEY, refreshToken, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "ユーザー情報の登録が完了しました。", data: { accessToken, user } }, HTTP_STATUS.CREATED);
    }
);

export { createUser };
