import { NotFound } from '@/components';
import { paths } from '@/config/paths';
import { HomeContainer } from '@/features/home/components/home-container';
import { LoginContainer } from '@/features/login/components/login-container';
import { MyPage } from '@/features/mypage/components/mypage/mypage';
import { SignupContainer } from '@/features/signup/components/signup-container';
import { UpdatePasswordContainer } from '@/features/updatepassword/components/update-password-container';
import { UpdateUserContainer } from '@/features/updateuser/components/update-user-container';
import { useEffect, useEffectEvent } from 'react';
import { useLocation, useNavigationType, useRoutes } from 'react-router-dom';
import { DashboardContainer } from './dashboard-container';
import { GuestRoute } from './guest-route';
import { ProtectedRoute } from './protected-route';


const routerList = [
    {
        path: paths.home.path,
        element: (
            <HomeContainer />
        )
    },
    {
        element: <GuestRoute />,
        children: [
            {
                path: paths.login.path,
                element: (
                    <LoginContainer />
                )
            },
            {
                path: paths.signup.path,
                element: (
                    <SignupContainer />
                )
            }
        ]
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <DashboardContainer />,
                children: [
                    {
                        path: paths.mypage.path,
                        element: (
                            <MyPage />
                        )
                    }
                ]
            },
            {
                path: paths.updateUser.path,
                element: (
                    <UpdateUserContainer />
                )
            },
            {
                path: paths.updatePassword.path,
                element: (
                    <UpdatePasswordContainer />
                )
            },
        ]
    },
    {
        path: `*`,
        element: <NotFound />
    }
];

export const AppRouter = () => {
    const router = useRoutes(routerList);
    const { pathname } = useLocation();
    const navigationType = useNavigationType();

    // ページ遷移時に先頭へスクロールする（ブラウザの戻る・進むではスクロール位置を保つ）
    const scrollToTopOnNavigate = useEffectEvent(() => {
        if (navigationType !== "POP") {
            window.scrollTo(0, 0);
        }
    });

    // ページ遷移（pathname の変化）時だけ実行する
    useEffect(() => {
        scrollToTopOnNavigate();
    }, [pathname]);

    return router;
};
