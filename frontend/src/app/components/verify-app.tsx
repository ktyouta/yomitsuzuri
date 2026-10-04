import { type ReactNode } from "react";
import { type LoginUserType, useVerify } from "../api/verify";

type ChildrenPropsType = {
    user: LoginUserType | null
}

type PropsType = {
    children: (props: ChildrenPropsType) => ReactNode;
}

export function VerifyApp(props: PropsType) {

    // 認証チェック
    const { data } = useVerify();
    return props.children({
        user: data ? data.data.userInfo : null
    });
}