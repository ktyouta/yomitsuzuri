import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { LoginUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { RefreshToken } from "../../../domain";
import { GetUserProfileRepository, UserLoginRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { UserLoginResponseDto } from "../dto";
import { UserLoginSchema } from "../schema";

const userLogin = new Hono<AppEnv>().post(
    API_ENDPOINT.USER_LOGIN,
    zValidator("json", UserLoginSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
    }),
    async (c) => {
        const body = c.req.valid("json");
        const db = c.get('db');
        const config = c.get('envConfig');
        const loginRepository = new UserLoginRepository(db);
        const userProfileRepository = new GetUserProfileRepository(db);
        const usecase = new LoginUsecase(loginRepository, userProfileRepository, config);

        const result = await usecase.execute(body.name, body.password);

        if (!result) {
            return c.json({ message: "IDかパスワードが間違っています。" }, HTTP_STATUS.UNAUTHORIZED);
        }

        const responseDto = new UserLoginResponseDto(result.userInfo, result.accessToken.token);

        setCookie(c, RefreshToken.COOKIE_KEY, result.refreshToken.value, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "ログイン成功", data: responseDto.value }, HTTP_STATUS.OK);
    }
);

export { userLogin };
