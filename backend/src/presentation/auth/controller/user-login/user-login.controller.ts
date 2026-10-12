import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { LoginUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RefreshToken } from "../../../../domain";
import { GetUserProfileRepository, UserLoginRepository } from "../../../../infrastructure";
import { validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { UserLoginSchema } from "../../schema";

const userLogin = new Hono<AppEnv>().post(
    API_ENDPOINT.USER_LOGIN,
    validatorMiddleware("json", UserLoginSchema),
    async (c) => {
        const body = c.req.valid("json");
        const db = c.get('db');
        const config = c.get('envConfig');
        const loginRepository = new UserLoginRepository(db);
        const userProfileRepository = new GetUserProfileRepository(db);
        const usecase = new LoginUsecase(loginRepository, userProfileRepository, config);

        const result = await usecase.execute({ name: body.name, password: body.password });

        if (result.isErr()) {
            const error = result.error;
            switch (error.type) {
                case "INVALID_INPUT":
                    return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
                case "AUTHENTICATION_FAILED":
                    return c.json({ message: "IDかパスワードが間違っています。" }, HTTP_STATUS.UNAUTHORIZED);
                default: {
                    // 全てのエラー種別を網羅していることを型で保証する
                    error satisfies never;
                    return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
                }
            }
        }

        const { accessToken, refreshToken, user } = result.value.value;

        setCookie(c, RefreshToken.COOKIE_KEY, refreshToken, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "ログイン成功", data: { accessToken, user } }, HTTP_STATUS.OK);
    }
);

export { userLogin };
