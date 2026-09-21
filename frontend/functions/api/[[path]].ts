type Env = {
    BACKEND_API_URL: string;
};

/**
 * バックエンドAPIへのプロキシ
 * フロントと同一オリジン配下で /api/* を受け、バックエンドの実URLへ転送する
 * @param context
 * @returns
 */
export const onRequest: PagesFunction<Env> = async (context) => {
    const url = new URL(context.request.url);
    const backendUrl = new URL(url.pathname + url.search, context.env.BACKEND_API_URL);

    return fetch(new Request(backendUrl, context.request));
};
