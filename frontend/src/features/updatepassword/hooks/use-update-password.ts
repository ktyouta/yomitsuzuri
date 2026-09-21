import { LoginUserContext } from '@/app/components/login-user-provider';
import { paths } from '@/config/paths';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useUpdatePasswordMutation } from '../api/update-password';
import { useUpdatePasswordForm } from './use-update-password.form';

export function useUpdatePassword() {

    // ルーティング用
    const navigate = useNavigate();
    // エラーメッセージ
    const [errMessage, setErrMessage] = useState(``);
    // ログインユーザー情報
    const loginUser = LoginUserContext.useCtx();
    // フォーム
    const { register, handleSubmit, formState: { errors } } = useUpdatePasswordForm();
    // ルーティング用
    const { appGoBack } = useAppNavigation();
    // 更新リクエスト
    const postMutation = useUpdatePasswordMutation({
        onSuccess: (res) => {
            navigate(paths.home.path);
            toast.success(res.message);
        },
        onError: (message: string) => {
            setErrMessage(message);
        },
    });

    /**
     * パスワード更新実行
     */
    const handleConfirm = handleSubmit((data) => {

        if (!loginUser?.id) {
            setErrMessage('ユーザー情報が取得できません');
            return;
        }

        postMutation.mutate({
            json: {
                nowPassword: data.nowPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
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
        back,
        isLoading: postMutation.isPending,
        register,
        errors,
        handleConfirm,
    }
}
