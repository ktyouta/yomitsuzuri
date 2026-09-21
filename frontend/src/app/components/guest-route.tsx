import { paths } from "@/config/paths";
import { Navigate, Outlet } from "react-router-dom";
import { LoginUserContext } from "./login-user-provider";


export function GuestRoute() {

    // ログインユーザー情報
    const loginUser = LoginUserContext.useCtx();

    if (loginUser) {
        return (
            <Navigate
                to={paths.home.path}
                replace
            />
        );
    }

    return (
        <Outlet />
    );
}

