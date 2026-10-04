import { paths } from "@/config/paths";
import { registerResetLogin } from "@/stores/access-token-store";
import { createCtx } from "@/utils/create-ctx";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type LoginUserType } from "../api/verify";
import { SetThemeContext } from "./theme-provider";

// ログインユーザー情報
export const LoginUserContext = createCtx<LoginUserType | null>();
// ログインユーザー情報(setter)
export const SetLoginUserContext = createCtx<React.Dispatch<React.SetStateAction<LoginUserType | null>>>();

type PropsType = {
    children: ReactNode;
    loginUser: LoginUserType | null;
}

export function LoginUserProvider(props: PropsType) {

    // ログインユーザー情報
    const [loginUser, setLoginUser] = useState<LoginUserType | null>(props.loginUser);
    // ルーティング用
    const navigate = useNavigate();
    // テーマ状態(setter)
    const setTheme = SetThemeContext.useCtx();

    /**
     * ログイン画面に遷移
     */
    const moveLogin = useCallback(() => {
        navigate(paths.login.getHref(window.location.pathname));
    }, [navigate]);

    /**
     * ユーザー情報をリセット
     */
    const resetUser = useCallback(() => {
        setLoginUser(null);
    }, []);

    // ログインリセット処理を登録（登録は上書きのため、navigate が変わった場合は最新の処理で登録し直す）
    useEffect(() => {
        registerResetLogin({
            resetUser,
            moveLogin,
        });
    }, [resetUser, moveLogin]);

    // ログインユーザーのダークモード設定をThemeContextに反映
    const darkMode = loginUser?.darkMode;
    useEffect(() => {
        if (darkMode !== undefined) {
            setTheme(darkMode ? 'dark' : 'light');
        }
    }, [darkMode, setTheme]);

    return (
        <LoginUserContext.Provider value={loginUser}>
            <SetLoginUserContext.Provider value={setLoginUser}>
                {props.children}
            </SetLoginUserContext.Provider>
        </LoginUserContext.Provider>
    );
}
