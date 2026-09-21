export const paths = {
    home: {
        path: '/',
        getHref: () => paths.home.path,
    },
    sample: {
        path: '/sample',
        getHref: () => paths.sample.path,
    },
    mypage: {
        path: '/mypage',
        getHref: () => paths.mypage.path,
    },
    login: {
        path: '/login',
        getHref: (redirectTo?: string) => `${paths.login.path}${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ``}`,
    },
    signup: {
        path: '/signup',
        getHref: (redirectTo?: string) => `${paths.signup.path}${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ``}`,
    },
    updateUser: {
        path: '/update-user',
        getHref: (redirectTo?: string) => `${paths.updateUser.path}${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ``}`,
    },
    updatePassword: {
        path: '/update-password',
        getHref: (redirectTo?: string) => `${paths.updatePassword.path}${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ``}`,
    }
} as const;