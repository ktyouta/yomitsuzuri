import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { RefreshUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { Cookie, RefreshToken } from "../../../domain";
import { GetUserProfileRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";

/**
 * トークンリフレッシュ
 * @route POST /api/v1/refresh
 */
const refresh = new Hono<AppEnv>().post(API_ENDPOINT.REFRESH, async (c) => {

    const config = c.get('envConfig');
    try {
        const db = c.get('db');
        const repository = new GetUserProfileRepository(db);
        const usecase = new RefreshUsecase(repository, config);
        const cookie = new Cookie(getCookie(c));
        const refreshToken = RefreshToken.get(cookie, config);

        const result = await usecase.execute(refreshToken);

        if (result.status !== "success") {
            const logMessage = result.status === "invalid_token"
                ? "リフレッシュトークンが無効です"
                : result.status === "user_not_found"
                    ? "ユーザーが見つかりません"
                    : "リフレッシュトークンの絶対期限切れ";
            console.warn(`Refresh failed: ${logMessage}`);
            setCookie(c, RefreshToken.COOKIE_KEY, "", RefreshToken.getCookieClearOption(config));
            return c.json({ message: "認証失敗" }, HTTP_STATUS.UNAUTHORIZED);
        }

        setCookie(c, RefreshToken.COOKIE_KEY, result.refreshToken.value, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "認証成功", data: result.accessToken.token }, 200);
    } catch (e) {
        console.warn(`Refresh failed: ${e}`);

        setCookie(c, RefreshToken.COOKIE_KEY, "", RefreshToken.getCookieClearOption(config));

        return c.json({ message: "認証失敗" }, HTTP_STATUS.UNAUTHORIZED);
    }
});

export { refresh };
