import { LoginUserType } from "@/app/api/verify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UpdateUserRequestSchema, UpdateUserRequestType } from "../types/update-user-request-type";

/**
 * yyyyMMdd形式の生年月日を年・月・日に分割する
 * @param birthday yyyyMMdd形式の文字列（不正な形式の場合は空文字を返す）
 * @returns 年・月・日に分割したオブジェクト
 */
function parseBirthday(birthday: string): { year: string; month: string; day: string } {
    if (!/^\d{8}$/.test(birthday)) {
        return { year: ``, month: ``, day: `` };
    }
    return {
        year: birthday.slice(0, 4),
        month: birthday.slice(4, 6),
        day: birthday.slice(6, 8),
    };
}

export function useUpdateUserForm(loginUser: LoginUserType | null) {

    return useForm<UpdateUserRequestType>({
        resolver: zodResolver(UpdateUserRequestSchema),
        defaultValues: {
            name: ``,
            birthday: {
                year: ``,
                month: ``,
                day: ``,
            },
        },
        // ログインユーザーの現在値をフォームの初期値にする（未取得時は defaultValues のまま）
        values: loginUser ? {
            name: loginUser.name,
            birthday: parseBirthday(loginUser.birthday),
        } : undefined,
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });
}