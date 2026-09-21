import { ReactNode } from "react";
import { LoginUserType, verify } from "../api/verify";

type ChildrenPropsType = {
    user: LoginUserType | null
}

type PropsType = {
    children: (props: ChildrenPropsType) => ReactNode;
}

export function VerifyApp(props: PropsType) {

    // 認証チェック
    const { data } = verify();
    return props.children({
        user: data ? data.data.userInfo : null
    });
}