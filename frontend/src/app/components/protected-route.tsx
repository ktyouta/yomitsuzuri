import { paths } from "@/config/paths";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoginUserContext } from "./login-user-provider";


export function ProtectedRoute() {

    // ログインユーザー情報
    const loginUser = LoginUserContext.useCtx();
    // パス取得用
    const location = useLocation();

    if (!loginUser) {
        return (
            <Navigate
                to={paths.login.getHref(location.pathname)}
                replace
            />
        );
    }

    return (
        <Outlet />
    );
}

