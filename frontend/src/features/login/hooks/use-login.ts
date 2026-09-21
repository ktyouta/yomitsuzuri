import { LoginUserContext, SetLoginUserContext } from '@/app/components/login-user-provider';
import { paths } from '@/config/paths';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { useClearSessionCache } from '@/hooks/use-clear-session-cache';
import { updateAccessToken } from '@/stores/access-token-store';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '../api/login';
import { LoginRequestType } from '../types/login-request-type';
import { useLoginForm } from './use-login-form';


export function useLogin() {

    // エラーメッセージ
    const [errMessage, setErrMessage] = useState(``);
    // ログインユーザー情報(setter)
    const setLoginUserInfo = SetLoginUserContext.useCtx();
    // フォーム
    const { register, handleSubmit, formState: { errors }, reset } = useLoginForm();
    // ログインユーザー情報
    const loginUser = LoginUserContext.useCtx();
    // ルーティング用
    const { appNavigate } = useAppNavigation();
    // セッションキャッシュ除去
    const { clearSessionCache } = useClearSessionCache();
    // リダイレクト先
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirectTo') || paths.home.path;

    /**
     * ログインリクエスト
     */
    const postMutation = useLoginMutation({
        // 正常終了後の処理
        onSuccess: (res) => {
            const data = res.data;
            setLoginUserInfo(data.user);
            updateAccessToken(data.accessToken);
            // 前セッションのキャッシュ（他ユーザーのデータ・エラー）を除去
            clearSessionCache();
            appNavigate(redirectTo);
        },
        // 失敗後の処理
        onError: (errorMessage: string) => {
            setErrMessage(errorMessage);
            reset({
                name: ``,
                password: ``,
            });
        },
    });

    /**
     * ログインボタン押下
     */
    const clickLogin = handleSubmit((data) => {

        const name = data.name;
        const password = data.password

        const body: LoginRequestType = {
            name,
            password,
        };

        // ログインリクエスト呼び出し
        postMutation.mutate(body);
    });

    /**
     * サインアップ画面に遷移
     */
    function navigateSignup() {
        appNavigate(paths.signup.path);
    }

    /**
     * エンターキー押下時イベント
     */
    function handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            clickLogin();
        }
    };

    return {
        errMessage,
        isLoading: postMutation.isPending,
        register,
        errors,
        clickLogin,
        loginUser,
        redirectTo,
        navigateSignup,
        handleKeyPress,
    }
}
