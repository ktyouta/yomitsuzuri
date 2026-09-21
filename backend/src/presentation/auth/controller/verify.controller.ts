import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { VerifyUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { Cookie, RefreshToken } from "../../../domain";
import { GetUserProfileRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";


/**
 * 認証チェック
 * @route GET /api/v1/verify
 */
const verify = new Hono<AppEnv>().get(
    API_ENDPOINT.VERIFY,
    async (c) => {
        const config = c.get('envConfig');
        try {
            const db = c.get('db');
            const repository = new GetUserProfileRepository(db);
            const usecase = new VerifyUsecase(repository, config);
            const cookie = new Cookie(getCookie(c));
            const refreshToken = RefreshToken.get(cookie, config);

            const result = await usecase.execute(refreshToken);

            if (result.status !== "success") {
                const logMessage = result.status === "user_not_found"
                    ? "ユーザーが見つかりません"
                    : "リフレッシュトークンの絶対期限切れ";
                console.warn(`verify failed: ${logMessage}`);
                setCookie(c, RefreshToken.COOKIE_KEY, "", RefreshToken.getCookieClearOption(config));
                return c.json({ message: "認証失敗" }, HTTP_STATUS.UNAUTHORIZED);
            }

            return c.json({
                message: "認証成功",
                data: {
                    accessToken: result.accessToken.token,
                    userInfo: {
                        id: result.userInfo.id,
                        name: result.userInfo.name,
                        birthday: result.userInfo.birthday,
                        darkMode: result.userInfo.darkMode,
                    },
                },
            }, 200);
        } catch (e) {
            console.warn(`Verify failed: ${e}`);

            setCookie(c, RefreshToken.COOKIE_KEY, "", RefreshToken.getCookieClearOption(config));

            return c.json({ message: "認証失敗" }, HTTP_STATUS.UNAUTHORIZED);
        }
    }
);

export { verify };
