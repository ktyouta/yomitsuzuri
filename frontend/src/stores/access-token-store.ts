
// アクセストークン
export let accessTokenRef: string | null = null;
// ログインリセット
let resetLoginRef: ResetLoginType | null = null;

type ResetLoginType = {
    resetUser(): void,
    moveLogin(): void,
}

/**
 * アクセストークンを更新
 * @param token 
 */
export const updateAccessToken = (token: string) => {
    accessTokenRef = token;
};

/**
 * アクセストークンをリセット
 */
export const resetAccessToken = () => {
    accessTokenRef = null;
}

/**
 * ログインリセット処理を登録
 * @param setter 
 */
export const registerResetLogin = (props: ResetLoginType) => {
    resetLoginRef = props;
};

/**
 * ログインリセット
 */
export const resetLogin = () => {
    resetLoginRef?.resetUser();
    resetLoginRef?.moveLogin();
}