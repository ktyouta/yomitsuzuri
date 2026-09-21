import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { RefreshToken } from "../../../domain";
import type { AppEnv } from "../../../types";

const userLogout = new Hono<AppEnv>().post(
    API_ENDPOINT.USER_LOGOUT,
    async (c) => {
        const config = c.get('envConfig');
        deleteCookie(c, RefreshToken.COOKIE_KEY, RefreshToken.getCookieClearOption(config));
        return c.json({ message: `ログアウトしました。` }, HTTP_STATUS.OK);
    }
);

export { userLogout };
