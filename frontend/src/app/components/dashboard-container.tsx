import { Dashboard } from '@/components/layouts/dashboard/dashboard';
import { paths } from '@/config/paths';
import { useAppNavigation } from '@/hooks/use-app-navigation';
import { resetLogin } from '@/stores/access-token-store';
import { HiOutlineHome } from 'react-icons/hi2';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUpdateUserDarkModeMutation } from '../api/update-user-dark-mode';
import { useLogoutMutation } from '../api/logout';
import { LoginUserContext, SetLoginUserContext } from './login-user-provider';
import { SetThemeContext, ThemeContext } from './theme-provider';

const navItems = [
    { to: paths.mypage.path, label: 'マイページ', icon: <HiOutlineHome className="h-5 w-5 shrink-0" /> },
];

export function DashboardContainer() {

    // ログインユーザー情報
    const loginUser = LoginUserContext.useCtx();
    // テーマ
    const theme = ThemeContext.useCtx();
    // テーマ(setter)
    const setTheme = SetThemeContext.useCtx();
    // ログインユーザー情報(setter)
    const setLoginUser = SetLoginUserContext.useCtx();
    // ルーティング用
    const { appNavigate } = useAppNavigation();
    // ログアウトミューテーション
    const logoutMutation = useLogoutMutation({
        onSuccess: () => {
            resetLogin();
        },
        onError: (message: string) => {
            toast.error(message);
        },
    });
    // ダークモード設定更新ミューテーション
    const updateDarkModeMutation = useUpdateUserDarkModeMutation({
        onError: (message: string) => {
            toast.error(message);
        },
    });

    if (!loginUser) {
        return (
            <Navigate
                to={paths.login.path}
                replace
            />
        );
    }

    /**
     * ユーザー情報更新画面遷移
     */
    function moveUserInfoUpdate() {
        appNavigate(paths.updateUser.path);
    }

    /**
     * パスワード更新画面遷移
     */
    function movePasswordUpdate() {
        appNavigate(paths.updatePassword.path);
    }

    /**
     * ログアウト
     */
    function logout() {
        logoutMutation.mutate();
    }

    /**
     * ダッシュボードのホーム画面遷移
     */
    function moveHome() {
        appNavigate(paths.mypage.path);
    }

    /**
     * テーマ切替
     * 見た目を即時反映し、DBへの保存は裏で行う（失敗時のみ元に戻す）
     */
    function toggleTheme() {
        const previousTheme = theme;
        const nextDarkMode = theme !== 'dark';

        setTheme(nextDarkMode ? 'dark' : 'light');

        updateDarkModeMutation.mutate(
            { json: { darkMode: nextDarkMode } },
            {
                onSuccess: () => {
                    setLoginUser((prev) => (prev ? { ...prev, darkMode: nextDarkMode } : prev));
                },
                onError: () => {
                    setTheme(previousTheme);
                },
            }
        );
    }

    return (
        <Dashboard
            loginUser={loginUser}
            moveHome={moveHome}
            moveUserInfoUpdate={moveUserInfoUpdate}
            movePasswordUpdate={movePasswordUpdate}
            logout={logout}
            theme={theme}
            toggleTheme={toggleTheme}
            navItems={navItems}
        >
            <Outlet />
        </Dashboard>
    );
}
