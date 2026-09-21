import { LoginUserContext, SetLoginUserContext } from '@/app/components/login-user-provider';
import { paths } from '@/config/paths';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useCreateYearList } from '@/hooks/use-create-year-list';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useUpdateUserMutation } from '../api/update-user';
import { useUpdateUserForm } from './use-update-user.form';

/**
 * 生年月日をyyyyMMdd形式に変換
 */
function formatBirthday(birthday: { year: string; month: string; day: string }): string {
    const month = birthday.month.padStart(2, '0');
    const day = birthday.day.padStart(2, '0');
    return `${birthday.year}${month}${day}`;
}

export function useUpdateUser() {

    // ルーティング用
    const navigate = useNavigate();
    // エラーメッセージ
    const [errMessage, setErrMessage] = useState(``);
    // ログインユーザー情報
    const loginUser = LoginUserContext.useCtx();
    // ログインユーザー情報(setter)
    const setLoginUserInfo = SetLoginUserContext.useCtx();
    // 年リスト
    const yearCoomboList = useCreateYearList();
    // フォーム
    const { register, handleSubmit, formState: { errors }, watch } = useUpdateUserForm(loginUser);
    // ルーティング用
    const { appGoBack } = useAppNavigation();
    // 更新リクエスト
    const postMutation = useUpdateUserMutation({
        // 正常終了後の処理
        onSuccess: (res) => {
            setLoginUserInfo(res.data.user);
            toast.success(res.message);
            navigate(paths.home.path);
        },
        // 失敗後の処理
        onError: (message: string) => {

            //エラーメッセージを表示
            setErrMessage(message);
        },
    });

    /**
     * ユーザー更新実行
     */
    const handleConfirm = handleSubmit((data) => {

        if (!loginUser?.id) {
            setErrMessage('ユーザー情報が取得できません');
            return;
        }

        // 更新リクエスト呼び出し
        postMutation.mutate({
            json: {
                name: data.name,
                birthday: formatBirthday(data.birthday),
            },
        });
    });

    /**
     * 戻るボタン押下
     */
    function back() {
        appGoBack(paths.home.path);
    }

    return {
        errMessage,
        yearCoomboList,
        back,
        isLoading: postMutation.isPending,
        register,
        errors,
        handleConfirm,
        watch,
    }
}